using System.IO.Compression;
using System.Reflection;
using Microsoft.Win32;

const string ExtensionFolderName = "premiere-marker-timestamps";
const string ExtensionDisplayName = "Marker Timestamps";
var quiet = args.Any(arg => arg.Equals("--quiet", StringComparison.OrdinalIgnoreCase));

static void WriteStep(string message)
{
    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine(message);
    Console.ResetColor();
}

static void WriteSuccess(string message)
{
    Console.ForegroundColor = ConsoleColor.Green;
    Console.WriteLine(message);
    Console.ResetColor();
}

static void WriteError(string message)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine(message);
    Console.ResetColor();
}

static void WaitToClose()
{
    Console.WriteLine();
    Console.WriteLine("Press any key to close...");
    Console.ReadKey(true);
}

void WaitToCloseIfNeeded()
{
    if (!quiet)
    {
        WaitToClose();
    }
}

Console.Title = $"{ExtensionDisplayName} Installer";
Console.WriteLine();
Console.WriteLine($"{ExtensionDisplayName} installer for Adobe Premiere Pro");
Console.WriteLine("=================================================");
Console.WriteLine();
Console.WriteLine("Close Premiere Pro before installing. If it is open now, close it,");
Console.WriteLine("then come back to this installer.");
Console.WriteLine();

try
{
    var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
    if (string.IsNullOrWhiteSpace(appData))
    {
        throw new InvalidOperationException("Could not find the current user's AppData folder.");
    }

    var targetRoot = Path.Combine(appData, "Adobe", "CEP", "extensions");
    var targetDir = Path.Combine(targetRoot, ExtensionFolderName);
    Directory.CreateDirectory(targetRoot);

    if (Directory.Exists(targetDir))
    {
        WriteStep("Removing previous installed copy...");
        Directory.Delete(targetDir, recursive: true);
    }

    WriteStep("Installing extension...");

    var assembly = Assembly.GetExecutingAssembly();
    using var payloadStream = assembly.GetManifestResourceStream("payload.zip")
        ?? throw new InvalidOperationException("Installer payload was not found.");

    using var archive = new ZipArchive(payloadStream, ZipArchiveMode.Read);
    archive.ExtractToDirectory(targetRoot, overwriteFiles: true);

    var manifestPath = Path.Combine(targetDir, "CSXS", "manifest.xml");
    if (!File.Exists(manifestPath))
    {
        throw new FileNotFoundException("Installation completed, but the CEP manifest was not found.", manifestPath);
    }

    WriteStep("Enabling unsigned CEP extension loading for this Windows user...");
    for (var version = 6; version <= 15; version++)
    {
        using var key = Registry.CurrentUser.CreateSubKey($@"Software\Adobe\CSXS.{version}");
        key?.SetValue("PlayerDebugMode", "1", RegistryValueKind.String);
    }

    Console.WriteLine();
    WriteSuccess("Installation complete.");
    Console.WriteLine();
    Console.WriteLine("Restart Adobe Premiere Pro, then open:");
    Console.WriteLine();
    Console.WriteLine("  Window > Extensions > Marker Timestamps");
    Console.WriteLine();
    Console.WriteLine("Installed to:");
    Console.WriteLine($"  {targetDir}");
    WaitToCloseIfNeeded();
    return 0;
}
catch (Exception ex)
{
    Console.WriteLine();
    WriteError("Installation failed.");
    Console.WriteLine(ex.Message);
    WaitToCloseIfNeeded();
    return 1;
}
