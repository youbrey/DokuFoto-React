using FluentAssertions;
using SetwanDokuFoto.PrintEngine;
using Xunit;

namespace SetwanDokuFoto.PrintEngine.Tests;

public class PrintEngineSmokeTests
{
    [Fact]
    public async Task GetAvailablePrintersAsync_Should_Return_List_Of_Printers()
    {
        // Arrange
        var service = new WpfPrintService();

        // Act
        var printers = await service.GetAvailablePrintersAsync();

        // Assert
        printers.Should().NotBeNull();
        printers.Should().NotBeEmpty();
    }
}
