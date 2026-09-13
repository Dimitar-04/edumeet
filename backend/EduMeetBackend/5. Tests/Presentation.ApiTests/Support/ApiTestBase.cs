using Xunit;

namespace Presentation.ApiTests.Support;

[Collection(ApiTestCollection.Name)]
public abstract class ApiTestBase(ApiTestFixture fixture) : IAsyncLifetime
{
    protected ApiTestFixture Fixture { get; } = fixture;

    public Task InitializeAsync() => Fixture.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;
}
