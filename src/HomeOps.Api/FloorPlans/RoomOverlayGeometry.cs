namespace HomeOps.Api.FloorPlans;

public static class RoomOverlayGeometry
{
    public const int MaxVertices = 250;
    public static List<RoomOverlayValidationIssue> Validate(IReadOnlyList<NormalizedPoint>? points, NormalizedPoint? anchor = null)
    {
        var e = new List<RoomOverlayValidationIssue>();
        if (points is null || points.Count == 0) { e.Add(new("PolygonRequired", "Polygon geometry is required.")); return e; }
        if (points.Count > MaxVertices) e.Add(new("TooManyVertices", $"Polygon has more than {MaxVertices} vertices."));
        if (points.Any(p => p.X < 0 || p.X > 1 || p.Y < 0 || p.Y > 1)) e.Add(new("PointOutOfRange", "All polygon points must be normalized within 0..1."));
        for (var i = 0; i < points.Count; i++) if (Same(points[i], points[(i + 1) % points.Count])) e.Add(new("DuplicateAdjacentPoint", "Polygon cannot contain duplicate adjacent points."));
        if (points.Distinct().Count() < 3) e.Add(new("TooFewVertices", "Polygon requires at least three unique vertices."));
        if (Math.Abs((double)Area(points)) <= 0.0000000001) e.Add(new("ZeroArea", "Polygon area must be non-zero."));
        if (SelfIntersects(points)) e.Add(new("SelfIntersection", "Polygon cannot self-intersect."));
        if (anchor is not null)
        {
            if (anchor.X < 0 || anchor.X > 1 || anchor.Y < 0 || anchor.Y > 1) e.Add(new("AnchorOutOfRange", "Label anchor must be normalized within 0..1."));
            else if (!ContainsPoint(points, anchor)) e.Add(new("AnchorOutsidePolygon", "Label anchor must be inside the polygon."));
        }
        return e.GroupBy(x => x.Code).Select(g => g.First()).ToList();
    }
    public static decimal Area(IReadOnlyList<NormalizedPoint> p) { decimal s = 0; for (var i=0;i<p.Count;i++){var a=p[i]; var b=p[(i+1)%p.Count]; s += a.X*b.Y - b.X*a.Y;} return s/2; }
    public static bool HasPositiveOverlap(IReadOnlyList<NormalizedPoint> a, IReadOnlyList<NormalizedPoint> b)
    {
        if (a.Count < 3 || b.Count < 3) return false;
        foreach (var p in a) if (StrictInside(b,p)) return true;
        foreach (var p in b) if (StrictInside(a,p)) return true;
        for (var i=0;i<a.Count;i++) if (StrictInside(b, Mid(a[i], a[(i+1)%a.Count]))) return true;
        for (var i=0;i<b.Count;i++) if (StrictInside(a, Mid(b[i], b[(i+1)%b.Count]))) return true;
        for (var i=0;i<a.Count;i++) for(var j=0;j<b.Count;j++) if (SegmentsCrossInterior(a[i], a[(i+1)%a.Count], b[j], b[(j+1)%b.Count])) return true;
        return false;
    }
    public static bool ContainsPoint(IReadOnlyList<NormalizedPoint> poly, NormalizedPoint p) => OnBoundary(poly,p) || StrictInside(poly,p);
    private static bool StrictInside(IReadOnlyList<NormalizedPoint> poly, NormalizedPoint p){ var inside=false; for(int i=0,j=poly.Count-1;i<poly.Count;j=i++){var pi=poly[i]; var pj=poly[j]; if (OnSegment(pj,p,pi)) return false; if (((pi.Y>p.Y)!=(pj.Y>p.Y)) && p.X < (pj.X-pi.X)*(p.Y-pi.Y)/(pj.Y-pi.Y)+pi.X) inside=!inside;} return inside; }
    private static bool OnBoundary(IReadOnlyList<NormalizedPoint> poly, NormalizedPoint p){ for(var i=0;i<poly.Count;i++) if(OnSegment(poly[i],p,poly[(i+1)%poly.Count])) return true; return false; }
    private static bool SelfIntersects(IReadOnlyList<NormalizedPoint> p){ for(var i=0;i<p.Count;i++) for(var j=i+1;j<p.Count;j++){ if (Math.Abs(i-j)<=1 || (i==0 && j==p.Count-1)) continue; if (SegmentsIntersect(p[i],p[(i+1)%p.Count],p[j],p[(j+1)%p.Count])) return true;} return false; }
    private static bool SegmentsCrossInterior(NormalizedPoint a, NormalizedPoint b, NormalizedPoint c, NormalizedPoint d) => SegmentsIntersect(a,b,c,d) && !OnSegment(a,c,b) && !OnSegment(a,d,b) && !OnSegment(c,a,d) && !OnSegment(c,b,d);
    private static bool SegmentsIntersect(NormalizedPoint a, NormalizedPoint b, NormalizedPoint c, NormalizedPoint d){ var o1=Orient(a,b,c); var o2=Orient(a,b,d); var o3=Orient(c,d,a); var o4=Orient(c,d,b); if (o1==0 && OnSegment(a,c,b)) return true; if(o2==0&&OnSegment(a,d,b)) return true; if(o3==0&&OnSegment(c,a,d)) return true; if(o4==0&&OnSegment(c,b,d)) return true; return (o1>0)!=(o2>0) && (o3>0)!=(o4>0); }
    private static NormalizedPoint Mid(NormalizedPoint a, NormalizedPoint b) => new((a.X + b.X) / 2, (a.Y + b.Y) / 2);
    private static decimal Orient(NormalizedPoint a, NormalizedPoint b, NormalizedPoint c)=> (b.X-a.X)*(c.Y-a.Y)-(b.Y-a.Y)*(c.X-a.X);
    private static bool OnSegment(NormalizedPoint a, NormalizedPoint p, NormalizedPoint b)=> Orient(a,p,b)==0 && p.X>=Math.Min(a.X,b.X) && p.X<=Math.Max(a.X,b.X) && p.Y>=Math.Min(a.Y,b.Y) && p.Y<=Math.Max(a.Y,b.Y);
    private static bool Same(NormalizedPoint a, NormalizedPoint b)=> a.X==b.X && a.Y==b.Y;
}
