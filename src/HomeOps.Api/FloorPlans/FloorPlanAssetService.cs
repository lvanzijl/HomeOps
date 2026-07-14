using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using Microsoft.Extensions.Options;

namespace HomeOps.Api.FloorPlans;

public sealed class FloorPlanAssetOptions
{
    public string StorageRoot { get; set; } = Path.Combine(AppContext.BaseDirectory, "floor-plan-assets");
    public long MaxUploadBytes { get; set; } = 10 * 1024 * 1024;
    public int MaxRasterWidth { get; set; } = 10000;
    public int MaxRasterHeight { get; set; } = 10000;
    public int MaxSvgElements { get; set; } = 5000;
    public int MaxSvgDepth { get; set; } = 64;
    public int MaxSvgAttributeLength { get; set; } = 4000;
}

public sealed record ValidatedFloorPlanUpload(string OriginalFilename, string MediaType, string Hash, byte[] SourceBytes, byte[] DerivativeBytes, int? SourceWidth, int? SourceHeight, decimal BasisWidth, decimal BasisHeight, string Summary);
public sealed record ValidatedFloorPlanDerivative(string MediaType, string Hash, byte[] DerivativeBytes, int? SourceWidth, int? SourceHeight, decimal BasisWidth, decimal BasisHeight, string Summary);

public sealed class FloorPlanAssetService(IOptions<FloorPlanAssetOptions> options)
{
    private readonly FloorPlanAssetOptions _options = options.Value;
    private static readonly Regex SafeName = new("[^a-zA-Z0-9._-]+", RegexOptions.Compiled);
    private static readonly HashSet<string> RemovedElements = new(StringComparer.OrdinalIgnoreCase) { "script", "foreignObject", "iframe", "object", "embed", "audio", "video", "animate", "animateMotion", "animateTransform", "set" };
    private static readonly HashSet<string> RejectedElements = new(StringComparer.OrdinalIgnoreCase) { "style" };

    public async Task<ValidatedFloorPlanUpload> ValidateAsync(IFormFile file, CancellationToken ct)
    {
        if (file.Length <= 0) throw new InvalidOperationException("Floor plan upload cannot be empty.");
        if (file.Length > _options.MaxUploadBytes) throw new InvalidOperationException($"Floor plan upload exceeds the configured {_options.MaxUploadBytes} byte limit.");
        await using var input = file.OpenReadStream();
        using var ms = new MemoryStream();
        await input.CopyToAsync(ms, ct);
        var bytes = ms.ToArray();
        if (bytes.LongLength != file.Length) throw new InvalidOperationException("Floor plan upload could not be read completely.");
        var filename = NormalizeFilename(file.FileName);
        var derivative = ValidateDerivativeBytes(bytes, filename);
        return new(filename, derivative.MediaType, ComputeHash(bytes), bytes, derivative.DerivativeBytes, derivative.SourceWidth, derivative.SourceHeight, derivative.BasisWidth, derivative.BasisHeight, derivative.Summary);
    }

    public ValidatedFloorPlanDerivative ValidateDerivativeBytes(byte[] bytes, string filename)
    {
        if (bytes.Length == 0) throw new InvalidOperationException("Floor plan content cannot be empty.");
        var media = Detect(bytes);
        var ext = Path.GetExtension(NormalizeFilename(filename)).TrimStart('.').ToLowerInvariant();
        if (!ExtensionMatches(ext, media)) throw new InvalidOperationException("Filename extension does not match the detected file content.");
        if (media == "image/png")
        {
            ValidatePng(bytes);
            var (w, h) = PngDimensions(bytes);
            CheckRaster(w, h);
            return new(media, ComputeHash(bytes), bytes, w, h, w, h, "PNG derivative validated from content signature and dimensions.");
        }
        if (media == "image/jpeg")
        {
            ValidateJpeg(bytes);
            var (w, h) = JpegDimensions(bytes);
            CheckRaster(w, h);
            return new(media, ComputeHash(bytes), bytes, w, h, w, h, "JPEG derivative validated from content signature and dimensions.");
        }
        if (media == "image/svg+xml")
        {
            var (safe, w, h, summary) = SanitizeSvg(Encoding.UTF8.GetString(bytes));
            var derivative = Encoding.UTF8.GetBytes(safe);
            return new(media, ComputeHash(derivative), derivative, (int?)Math.Round(w), (int?)Math.Round(h), w, h, summary);
        }
        throw new InvalidOperationException("Unsupported floor plan format. Use SVG, PNG, JPG, or JPEG.");
    }

    public async Task<(string SourceRef, string DerivativeRef)> StoreAsync(Guid householdId, Guid assetId, ValidatedFloorPlanUpload upload, CancellationToken ct)
    {
        var source = BuildContentPath(householdId, assetId, "source" + ExtensionFor(upload.MediaType));
        var derivative = BuildContentPath(householdId, assetId, "derivative" + ExtensionFor(upload.MediaType));
        try
        {
            await WriteAtomic(source, upload.SourceBytes, ct);
            await WriteAtomic(derivative, upload.DerivativeBytes, ct);
            return (ToRef(source), ToRef(derivative));
        }
        catch
        {
            TryDelete(source); TryDelete(derivative);
            throw;
        }
    }

    public async Task<string> StoreRestoredDerivativeAsync(Guid householdId, Guid assetId, string mediaType, byte[] derivativeBytes, CancellationToken ct)
    {
        var derivative = BuildContentPath(householdId, assetId, "derivative" + ExtensionFor(mediaType));
        await WriteAtomic(derivative, derivativeBytes, ct);
        return ToRef(derivative);
    }

    public async Task<byte[]?> ReadDerivativeAsync(FloorPlanAsset asset, CancellationToken ct)
    {
        var path = FromRef(asset.DerivativeContentReference);
        return File.Exists(path) ? await File.ReadAllBytesAsync(path, ct) : null;
    }

    public bool Exists(string reference) => File.Exists(FromRef(reference));
    public string MissingSourceReference(Guid householdId, Guid assetId) => ToRef(BuildContentPath(householdId, assetId, "source.missing"));
    public string DerivativeReference(Guid householdId, Guid assetId, string mediaType) => ToRef(BuildContentPath(householdId, assetId, "derivative" + ExtensionFor(mediaType)));
    public void DeleteAssetDirectory(Guid householdId, Guid assetId) => TryDeleteDirectory(SafeCombine(_options.StorageRoot, householdId.ToString("N"), assetId.ToString("N")));

    private string BuildContentPath(Guid householdId, Guid assetId, string filename) => SafeCombine(_options.StorageRoot, householdId.ToString("N"), assetId.ToString("N"), filename);
    private string ToRef(string path) => Path.GetRelativePath(Path.GetFullPath(_options.StorageRoot), Path.GetFullPath(path)).Replace('\\', '/');
    private string FromRef(string reference)
    {
        if (Path.IsPathFullyQualified(reference)) throw new InvalidOperationException("Invalid storage reference.");
        if (reference.Split('/', '\\').Any(part => part is ".." or "")) throw new InvalidOperationException("Invalid storage reference.");
        return SafeCombine(_options.StorageRoot, reference.Split(['/', '\\'], StringSplitOptions.RemoveEmptyEntries));
    }

    private static async Task WriteAtomic(string path, byte[] bytes, CancellationToken ct)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var tmp = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            await File.WriteAllBytesAsync(tmp, bytes, ct);
            File.Move(tmp, path, true);
        }
        finally
        {
            TryDelete(tmp);
        }
    }

    private static string SafeCombine(string root, params string[] parts)
    {
        var baseFull = Path.GetFullPath(root);
        var full = Path.GetFullPath(parts.Aggregate(baseFull, Path.Combine));
        if (!full.StartsWith(baseFull.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar, StringComparison.Ordinal) && !string.Equals(full, baseFull, StringComparison.Ordinal)) throw new InvalidOperationException("Invalid storage reference.");
        return full;
    }

    private static string NormalizeFilename(string name)
    {
        var file = Path.GetFileName(name);
        if (string.IsNullOrWhiteSpace(file) || file is "." or "..") return "floor-plan";
        var safe = SafeName.Replace(file.Trim(), "-");
        return safe[..Math.Min(160, safe.Length)];
    }

    private static string ExtensionFor(string media) => media switch { "image/png" => ".png", "image/jpeg" => ".jpg", "image/svg+xml" => ".svg", _ => ".bin" };
    private static bool ExtensionMatches(string ext, string media) => media switch { "image/png" => ext == "png", "image/jpeg" => ext is "jpg" or "jpeg", "image/svg+xml" => ext == "svg", _ => false };
    private static string ComputeHash(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();

    private static string Detect(byte[] b)
    {
        if (b.Length >= 8 && b[0] == 137 && b[1] == 80 && b[2] == 78 && b[3] == 71) return "image/png";
        if (b.Length >= 3 && b[0] == 255 && b[1] == 216 && b[2] == 255) return "image/jpeg";
        var s = Encoding.UTF8.GetString(b.Take(Math.Min(b.Length, 512)).ToArray()).TrimStart('\uFEFF', ' ', '\r', '\n', '\t');
        if (s.StartsWith("<svg", StringComparison.OrdinalIgnoreCase) || s.StartsWith("<?xml", StringComparison.OrdinalIgnoreCase) && s.Contains("<svg", StringComparison.OrdinalIgnoreCase)) return "image/svg+xml";
        return "unsupported";
    }

    private void CheckRaster(int w, int h)
    {
        if (w <= 0 || h <= 0) throw new InvalidOperationException("Image dimensions are missing or invalid.");
        if (w > _options.MaxRasterWidth || h > _options.MaxRasterHeight) throw new InvalidOperationException("Image dimensions exceed configured limits.");
    }

    private static void ValidatePng(byte[] b)
    {
        if (b.Length < 33) throw new InvalidOperationException("PNG file is corrupt.");
        if (Encoding.ASCII.GetString(b, 12, 4) != "IHDR") throw new InvalidOperationException("PNG header is invalid.");
        if (b.Length < 12 || Encoding.ASCII.GetString(b, b.Length - 8, 4) != "IEND") throw new InvalidOperationException("PNG file is truncated or missing its end marker.");
    }

    private static (int, int) PngDimensions(byte[] b) => (ReadBe32(b, 16), ReadBe32(b, 20));
    private static int ReadBe32(byte[] b, int i) => (b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3];

    private static void ValidateJpeg(byte[] b)
    {
        if (b.Length < 4 || b[^2] != 0xFF || b[^1] != 0xD9) throw new InvalidOperationException("JPEG file is truncated or missing its end marker.");
        _ = JpegDimensions(b);
    }

    private static (int, int) JpegDimensions(byte[] b)
    {
        int i = 2;
        while (i + 9 < b.Length)
        {
            if (b[i++] != 0xFF) continue;
            var marker = b[i++];
            if (marker == 0xD9) break;
            var len = (b[i] << 8) + b[i + 1];
            if (len < 2 || i + len > b.Length) break;
            if (marker is >= 0xC0 and <= 0xC3) return ((b[i + 5] << 8) + b[i + 6], (b[i + 3] << 8) + b[i + 4]);
            i += len;
        }
        throw new InvalidOperationException("JPEG dimensions could not be read.");
    }

    private (string, decimal, decimal, string) SanitizeSvg(string text)
    {
        if (text.Contains("<!DOCTYPE", StringComparison.OrdinalIgnoreCase) || text.Contains("<!ENTITY", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("SVG contains unsupported XML declarations.");
        XDocument doc;
        try
        {
            using var reader = XmlReader.Create(new StringReader(text), new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null, MaxCharactersFromEntities = 0, MaxCharactersInDocument = _options.MaxUploadBytes });
            doc = XDocument.Load(reader, LoadOptions.PreserveWhitespace);
        }
        catch
        {
            throw new InvalidOperationException("SVG could not be parsed.");
        }
        var root = doc.Root;
        if (root is null || root.Name.LocalName != "svg") throw new InvalidOperationException("SVG root element is missing.");
        var elements = root.DescendantsAndSelf().ToList();
        if (elements.Count > _options.MaxSvgElements) throw new InvalidOperationException("SVG is too complex.");
        if (MaxDepth(root) > _options.MaxSvgDepth) throw new InvalidOperationException("SVG nesting is too deep.");
        if (elements.Any(element => RejectedElements.Contains(element.Name.LocalName))) throw new InvalidOperationException("SVG contains unsupported embedded stylesheet content.");
        var removed = 0;
        foreach (var el in root.Descendants().ToList())
        {
            if (RemovedElements.Contains(el.Name.LocalName)) { el.Remove(); removed++; }
        }
        foreach (var el in root.DescendantsAndSelf())
        {
            foreach (var a in el.Attributes().ToList())
            {
                if (a.Value.Length > _options.MaxSvgAttributeLength) throw new InvalidOperationException("SVG contains an oversized attribute.");
                var n = a.Name.LocalName.ToLowerInvariant();
                var v = a.Value.Trim().ToLowerInvariant();
                if (n.StartsWith("on") || n is "href" or "src" && !IsSafeLocalReference(v) || a.Name.NamespaceName.Contains("xlink", StringComparison.OrdinalIgnoreCase) && n == "href" && !IsSafeLocalReference(v) || v.Contains("url(http") || v.Contains("@import") || v.Contains("javascript:") || v.StartsWith("data:")) { a.Remove(); removed++; }
            }
        }
        var (w, h) = SvgDimensions(root);
        if (w <= 0 || h <= 0) throw new InvalidOperationException("SVG requires a non-empty viewBox or deterministic width and height.");
        if (!root.Descendants().Any(IsRenderableSvgElement)) throw new InvalidOperationException("SVG does not contain renderable static plan content after sanitization.");
        var summary = removed == 0 ? "SVG sanitized without removing unsafe content." : $"SVG sanitized; removed {removed} unsafe elements or attributes before derivative creation.";
        return (doc.ToString(SaveOptions.DisableFormatting), w, h, summary);
    }

    private static bool IsSafeLocalReference(string value) => string.IsNullOrWhiteSpace(value) || value.StartsWith('#');
    private static bool IsRenderableSvgElement(XElement e) => e.Name.LocalName is "path" or "rect" or "circle" or "ellipse" or "line" or "polyline" or "polygon" or "text" or "g";
    private static int MaxDepth(XElement element) => element.Elements().Any() ? 1 + element.Elements().Max(MaxDepth) : 1;
    private static (decimal, decimal) SvgDimensions(XElement root)
    {
        var vb = (string?)root.Attribute("viewBox");
        if (!string.IsNullOrWhiteSpace(vb))
        {
            var p = vb.Split([' ', ','], StringSplitOptions.RemoveEmptyEntries);
            if (p.Length == 4 && decimal.TryParse(p[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var w) && decimal.TryParse(p[3], NumberStyles.Float, CultureInfo.InvariantCulture, out var h)) return (w, h);
        }
        return (ParseLength((string?)root.Attribute("width")), ParseLength((string?)root.Attribute("height")));
    }
    private static decimal ParseLength(string? s) => decimal.TryParse(new string((s ?? "").TakeWhile(c => char.IsDigit(c) || c == '.').ToArray()), NumberStyles.Float, CultureInfo.InvariantCulture, out var v) ? v : 0;
    private static void TryDelete(string path) { try { if (File.Exists(path)) File.Delete(path); } catch { } }
    private static void TryDeleteDirectory(string path) { try { if (Directory.Exists(path)) Directory.Delete(path, true); } catch { } }
}
