namespace _2._Application.Auth.Requests;


public sealed record UploadedFileData(
    byte[] Bytes,
    string OriginalFileName,
    string ContentType);