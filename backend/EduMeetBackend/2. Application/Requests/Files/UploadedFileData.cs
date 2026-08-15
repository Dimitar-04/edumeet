namespace _2._Application.Requests;


public sealed record UploadedFileData(
    byte[] Bytes,
    string OriginalFileName,
    string ContentType);