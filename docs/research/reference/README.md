# Reference Copies

Local copies of source material used by `docs/research/swedish-army-formations-and-procedures.md`.

These files are vendored for project reference and provenance. Keep the original URLs and checksums updated if any file is replaced.

| File | Source URL | Notes | SHA-256 |
| --- | --- | --- | --- |
| `msh-grp-2016.pdf` | `https://static.wixstatic.com/ugd/a137e0_55c20520f643447da25d99f104a11b03.pdf` | Public PDF mirror of `Handbok Markstrid - Grupp (MSH Grp 2016)`. The Försvarsmakten library record confirms title, publisher, year, length, and VIDAR id. | `261477b43ec081c6f3a0612a7e1ce4c7c1bf7a829577177255ecef4e5af7896f` |
| `soldf-2001.pdf` | `https://www.flygvapenfrivilliga.se/media/1289/soldf_2001_-_soldaten_i_f_lt.pdf` | Public PDF mirror of `Soldaten i fält (SoldF)`, 2001. The Försvarsmakten library record confirms title, publisher, year, and `M7742-100002`. | `40b620b8fa5df6f5f313406f3eccc2b0b7d780f491e8c78cca7cc99df31fb2d4` |
| `rustad-soldat-handtecken.html` | `https://rustadsoldat.se/artiklar/handtecken` | Secondary public reference for hand-sign names and descriptions. | `96df4bea33805c5bb831cbcf830849b8a6ec2ab8f4de25af2964100d6552baae` |
| `signs/` | `https://rustadsoldat.se/artiklar/handtecken` | Extracted PNG hand-sign image set. See [`signs/README.md`](signs/README.md). | See [`signs/SHA256SUMS`](signs/SHA256SUMS). |

## Retrieval Notes

- Direct downloads from the indexed `forsvarsmakten.se` PDF URLs for `SoldF` and `MSH Vintersoldat 2024` returned 404 from this environment on 2026-05-19, despite search indexes still showing cached text for them.
- Direct downloads of the Försvarsmakten library-record pages returned server errors from this environment, so those remain linked from the research note rather than vendored as HTML.
- `doczz.net` public transcriptions were blocked by a Cloudflare challenge during direct download and are not vendored here.
