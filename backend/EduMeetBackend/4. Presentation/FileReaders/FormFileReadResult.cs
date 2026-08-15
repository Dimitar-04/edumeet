using _2._Application.Requests;

namespace _4._Presentation.FileReaders;

public sealed record FormFileReadResult(
    UploadedFileData? File,
    string? Error)
{
    public bool Succeeded => Error is null;
}
