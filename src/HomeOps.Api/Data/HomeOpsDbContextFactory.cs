using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace HomeOps.Api.Data;

public sealed class HomeOpsDbContextFactory : IDesignTimeDbContextFactory<HomeOpsDbContext>
{
    public HomeOpsDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseNpgsql("Host=localhost;Port=5432;Database=homeops;Username=homeops;Password=homeops_dev_password")
            .Options;

        return new HomeOpsDbContext(options);
    }
}
