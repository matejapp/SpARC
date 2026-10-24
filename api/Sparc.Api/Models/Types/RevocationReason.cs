namespace Sparc.Api.Models;

/// <summary>Why a refresh token stopped working. Stored as smallint; null while the token is live.</summary>
public enum RevocationReason : short
{
    /// <summary>Exchanged for a new token. Presenting it again means it was stolen.</summary>
    Rotated = 0,

    /// <summary>A rotated token came back, so its whole family was killed.</summary>
    ReuseDetected = 1,

    /// <summary>Revoked by logout (card #11).</summary>
    LoggedOut = 2,
}
