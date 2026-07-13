using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class ClimateProviderMappingPersistenceTests
{
    [Fact]
    public void EfModelMatchesProviderMappingSchemaExpectations()
    {
        using var db = CreateDbContext();
        var provider = db.Model.FindEntityType(typeof(ClimateProvider));
        var mapping = db.Model.FindEntityType(typeof(RoomClimateSourceMapping));
        Assert.NotNull(provider);
        Assert.NotNull(mapping);

        Assert.Equal("ClimateProviders", provider!.GetTableName());
        Assert.Equal("RoomClimateSourceMappings", mapping!.GetTableName());
        Assert.Equal(["Id"], provider.FindPrimaryKey()!.Properties.Select(p => p.Name).ToArray());
        Assert.Equal(["Id"], mapping.FindPrimaryKey()!.Properties.Select(p => p.Name).ToArray());

        Assert.Equal(40, provider.FindProperty(nameof(ClimateProvider.ProviderType))!.GetMaxLength());
        Assert.Equal(160, provider.FindProperty(nameof(ClimateProvider.DisplayName))!.GetMaxLength());
        Assert.Equal(240, provider.FindProperty(nameof(ClimateProvider.ExternalInstanceReference))!.GetMaxLength());
        Assert.Equal(2000, provider.FindProperty(nameof(ClimateProvider.DiagnosticMetadata))!.GetMaxLength());

        Assert.Equal(64, mapping.FindProperty(nameof(RoomClimateSourceMapping.SourceRole))!.GetMaxLength());
        Assert.Equal(240, mapping.FindProperty(nameof(RoomClimateSourceMapping.ExternalSourceId))!.GetMaxLength());
        Assert.Equal(240, mapping.FindProperty(nameof(RoomClimateSourceMapping.ExternalDisplayName))!.GetMaxLength());
        Assert.Equal(80, mapping.FindProperty(nameof(RoomClimateSourceMapping.ExternalSourceKind))!.GetMaxLength());
        Assert.Equal(160, mapping.FindProperty(nameof(RoomClimateSourceMapping.ExternalAreaId))!.GetMaxLength());
        Assert.Equal(160, mapping.FindProperty(nameof(RoomClimateSourceMapping.ExternalAreaName))!.GetMaxLength());
        Assert.Equal(160, mapping.FindProperty(nameof(RoomClimateSourceMapping.ExternalDeviceId))!.GetMaxLength());
        Assert.Equal(160, mapping.FindProperty(nameof(RoomClimateSourceMapping.ExternalDeviceName))!.GetMaxLength());
        Assert.Equal(40, mapping.FindProperty(nameof(RoomClimateSourceMapping.Health))!.GetMaxLength());
        Assert.Equal(500, mapping.FindProperty(nameof(RoomClimateSourceMapping.DiagnosticSummary))!.GetMaxLength());

        var duplicateSourceIndex = Assert.Single(mapping.GetIndexes(), index => index.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomClimateSourceMapping.RoomId), nameof(RoomClimateSourceMapping.SourceRole), nameof(RoomClimateSourceMapping.ProviderId), nameof(RoomClimateSourceMapping.ExternalSourceId)]));
        Assert.True(duplicateSourceIndex.IsUnique);
        Assert.Equal("\"IsArchived\" = false", duplicateSourceIndex.GetFilter());
        var priorityIndex = Assert.Single(mapping.GetIndexes(), index => index.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomClimateSourceMapping.RoomId), nameof(RoomClimateSourceMapping.SourceRole), nameof(RoomClimateSourceMapping.Priority)]));
        Assert.True(priorityIndex.IsUnique);
        Assert.Equal("\"IsArchived\" = false", priorityIndex.GetFilter());
        Assert.Contains(mapping.GetIndexes(), index => index.Properties.Select(p => p.Name).SequenceEqual([nameof(RoomClimateSourceMapping.RoomId), nameof(RoomClimateSourceMapping.SourceRole), nameof(RoomClimateSourceMapping.IsArchived), nameof(RoomClimateSourceMapping.Priority)]));

        Assert.All(mapping.GetForeignKeys().Where(fk => fk.PrincipalEntityType.ClrType == typeof(Room) || fk.PrincipalEntityType.ClrType == typeof(ClimateProvider)), fk => Assert.Equal(DeleteBehavior.Restrict, fk.DeleteBehavior));
    }

    private static HomeOpsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase($"climate-schema-{Guid.NewGuid()}")
            .Options;
        return new HomeOpsDbContext(options);
    }
}
