# Privacy Policy — Playlist Multiselect for YouTube™

**Effective date:** 2026-10-07 · **Developer:** Mustafa Çiçek ([GitHub](https://github.com/mustafacicek-eee))

**English** · [Türkçe](#gizlilik-politikası)

Playlist Multiselect for YouTube™ ("the extension") is a Chrome extension that lets you select several videos in a YouTube playlist and copy, move, remove or sort them. This policy explains exactly what data the extension touches. In short: **the developer receives no data at all.**

## What the extension does not do
- It does not send any data to the developer or to any third party. There is no server, no analytics, no tracking and no advertising.
- It does not sell, share or transfer user data, and does not use it for any purpose other than the features described below.
- It does not load or execute remote code.

## Data the extension handles, only inside your browser
| Data | Why | Where it goes |
|---|---|---|
| Playlist contents shown on the page (video IDs, titles, channel names, durations) | To list, select, copy, move, remove and sort videos | Read from and sent back to `youtube.com` only, to perform the action you clicked |
| Your YouTube session cookie (`SAPISID` / `__Secure-3PAPISID`) | To create the same authorization header that youtube.com's own web page creates, so playlist changes are made with your existing login | The cookie value is never stored or sent anywhere by the extension; only the authorization header derived from it is sent, and only to `youtube.com` |
| Extension clipboard (video IDs, titles and source playlist of videos you copy or cut) | To paste videos into another playlist, also across tabs | Saved in your browser's `localStorage` for `youtube.com` (key `msx.clipboard.v1`); overwritten by your next copy or cut |
| Language choice (TR or EN) | To remember the interface language | Saved in your browser's `localStorage` for `youtube.com` (key `msx.lang.v1`) |

Video thumbnails are loaded from YouTube's image server (`i.ytimg.com`), as on YouTube itself. To check whether a hidden video is deleted or private, the extension calls YouTube's public oEmbed endpoint on `youtube.com`.

## Permissions
The extension requests no Chrome permissions. It runs only on `https://www.youtube.com/*`.

## Removing data
Uninstalling the extension stops all processing. The two `localStorage` entries above can be removed by clearing site data for `youtube.com` in Chrome's settings.

## Contact and changes
Questions: open an issue at https://github.com/mustafacicek-eee/youtube-playlist-multiselect/issues. Changes to this policy are published in this file, and the full history is visible in the repository.

This extension is not affiliated with, endorsed by or sponsored by YouTube or Google. YouTube is a trademark of Google LLC.

---

## Gizlilik politikası

**Yürürlük tarihi:** 2026-10-07 · **Geliştirici:** Mustafa Çiçek

YouTube™ için Playlist Çoklu Seçim ("eklenti"), YouTube oynatma listelerinde birden fazla videoyu seçip kopyalamanı, taşımanı, kaldırmanı ya da sıralamanı sağlayan bir Chrome eklentisidir. Kısaca: **geliştiriciye hiçbir veri gelmez.**

### Eklentinin yapmadıkları
- Geliştiriciye ya da üçüncü bir tarafa hiçbir veri göndermez. Sunucusu, analitiği, takibi ve reklamı yoktur.
- Kullanıcı verisini satmaz, paylaşmaz, aktarmaz; aşağıdaki özellikler dışında hiçbir amaçla kullanmaz.
- Uzaktan kod yüklemez ve çalıştırmaz.

### Eklentinin yalnızca tarayıcının içinde işlediği veriler
- **Sayfadaki liste içeriği** (video kimlikleri, başlıklar, kanal adları, süreler): listeleme, seçme ve tıkladığın işlemi yapmak için. Yalnızca `youtube.com`'dan okunur ve yalnızca `youtube.com`'a gönderilir.
- **YouTube oturum çerezin** (`SAPISID` / `__Secure-3PAPISID`): youtube.com'un kendi sayfasının ürettiği yetkilendirme başlığının aynısını üretmek için. Çerez değeri eklenti tarafından saklanmaz ve hiçbir yere gönderilmez; yalnızca ondan türetilen başlık, yalnızca `youtube.com`'a gönderilir.
- **Eklenti panosu** (kopyaladığın/kestiğin videoların kimlik, başlık ve kaynak liste bilgisi): başka listeye yapıştırmak için. Tarayıcının `youtube.com` localStorage'ında (`msx.clipboard.v1`) tutulur, bir sonraki kopyalama/kesme ile üzerine yazılır.
- **Dil seçimin** (TR/EN): `youtube.com` localStorage'ında (`msx.lang.v1`) tutulur.

Video küçük resimleri YouTube'un kendi görsel sunucusundan (`i.ytimg.com`) yüklenir. Gizli bir videonun silinmiş mi özel mi olduğunu anlamak için `youtube.com` üzerindeki herkese açık oEmbed servisi kullanılır.

### İzinler
Eklenti hiçbir Chrome izni istemez; yalnızca `https://www.youtube.com/*` sayfalarında çalışır.

### Verilerin silinmesi
Eklentiyi kaldırınca tüm işlem durur. Yukarıdaki iki localStorage kaydı, Chrome ayarlarından `youtube.com` site verileri temizlenerek silinebilir.

### İletişim ve değişiklikler
Sorular için: https://github.com/mustafacicek-eee/youtube-playlist-multiselect/issues. Bu politikadaki değişiklikler bu dosyada yayımlanır; geçmişi repoda görülebilir.

Bu eklenti YouTube veya Google ile bağlantılı değildir; onlar tarafından onaylanmamış veya desteklenmemiştir. YouTube, Google LLC'nin ticari markasıdır.
