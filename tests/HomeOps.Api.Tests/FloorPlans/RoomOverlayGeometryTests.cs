using HomeOps.Api.FloorPlans;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class RoomOverlayGeometryTests
{
    [Fact]
    public void AcceptsTriangleRectangleAndConcavePolygons()
    {
        Assert.Empty(RoomOverlayGeometry.Validate([new(0.1m,0.1m), new(0.8m,0.1m), new(0.2m,0.8m)]));
        Assert.Empty(RoomOverlayGeometry.Validate([new(0.1m,0.1m), new(0.8m,0.1m), new(0.8m,0.8m), new(0.1m,0.8m)]));
        Assert.Empty(RoomOverlayGeometry.Validate([new(0.1m,0.1m), new(0.8m,0.1m), new(0.45m,0.45m), new(0.8m,0.8m), new(0.1m,0.8m)]));
    }

    [Fact]
    public void RejectsInvalidGeometryAndAnchors()
    {
        Assert.Contains(RoomOverlayGeometry.Validate([new(0m,0m), new(1m,1m)]), e => e.Code == "TooFewVertices");
        Assert.Contains(RoomOverlayGeometry.Validate([new(0m,0m), new(0m,0m), new(1m,0m), new(0m,1m)]), e => e.Code == "DuplicateAdjacentPoint");
        Assert.Contains(RoomOverlayGeometry.Validate([new(0m,0m), new(0.5m,0.5m), new(1m,1m)]), e => e.Code == "ZeroArea");
        Assert.Contains(RoomOverlayGeometry.Validate([new(-0.1m,0m), new(1m,0m), new(0m,1m)]), e => e.Code == "PointOutOfRange");
        Assert.Contains(RoomOverlayGeometry.Validate([new(0m,0m), new(1m,1m), new(0m,1m), new(1m,0m)]), e => e.Code == "SelfIntersection");
        Assert.Contains(RoomOverlayGeometry.Validate([new(0m,0m), new(1m,0m), new(1m,1m), new(0m,1m)], new(1.2m,0.5m)), e => e.Code == "AnchorOutOfRange");
        Assert.Contains(RoomOverlayGeometry.Validate([new(0m,0m), new(0.5m,0m), new(0m,0.5m)], new(0.9m,0.9m)), e => e.Code == "AnchorOutsidePolygon");
    }

    [Fact]
    public void AllowsSharedEdgesButDetectsPositiveOverlapAndVertexLimit()
    {
        var left = new[] { new NormalizedPoint(0m,0m), new(0.5m,0m), new(0.5m,1m), new(0m,1m) };
        var right = new[] { new NormalizedPoint(0.5m,0m), new(1m,0m), new(1m,1m), new(0.5m,1m) };
        var overlap = new[] { new NormalizedPoint(0.4m,0m), new(1m,0m), new(1m,1m), new(0.4m,1m) };
        Assert.False(RoomOverlayGeometry.HasPositiveOverlap(left, right));
        Assert.True(RoomOverlayGeometry.HasPositiveOverlap(left, overlap));
        var many = Enumerable.Range(0, RoomOverlayGeometry.MaxVertices + 1).Select(i => new NormalizedPoint((decimal)i / (RoomOverlayGeometry.MaxVertices + 1), i % 2 == 0 ? 0.1m : 0.9m)).ToArray();
        Assert.Contains(RoomOverlayGeometry.Validate(many), e => e.Code == "TooManyVertices");
    }
}
