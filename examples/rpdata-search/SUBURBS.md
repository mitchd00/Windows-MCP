# What counts as "Sunshine Coast"

`run.js` flags a contact when **any property they own (per RP Data) matches one
of the rules below**. The logic lives in `sunshineCoast.js` and the data in
`config.js → sunshineCoast`. This file documents that list in plain English —
**edit `config.js`, not this file, to change behaviour** (this is just the
reference).

## How a match is decided

An owned-property address matches if **either**:

1. it contains one of the **postcodes** below (matched as a whole number), **or**
2. it contains one of the **suburb keywords** below (case-insensitive substring).

Two layers are used because RP Data address formatting varies — a postcode is
the most reliable signal, and the suburb keywords catch addresses where the
postcode is missing or formatted oddly.

## Postcodes (4550–4575)

Covers the Sunshine Coast Regional and Noosa Shire council areas.

| Postcode | Representative localities |
|---|---|
| 4550 | Caloundra, Golden Beach, Pelican Waters |
| 4551 | Caloundra West, Little Mountain, Aroona, Currimundi |
| 4552 | Maleny, Landsborough, Bald Knob |
| 4553 | Mooloolah Valley, Glenview |
| 4554 | Diamond Valley, Eudlo |
| 4555 | Palmwoods, Chevallum, Hunchy |
| 4556 | Buderim, Sippy Downs, Forest Glen, Tanawha |
| 4557 | Mooloolaba, Alexandra Headland |
| 4558 | Maroochydore, Kuluin, Cotton Tree |
| 4559 | Woombye |
| 4560 | Nambour, Burnside, Coes Creek |
| 4561 | Yandina, Bli Bli (also 4560 area) |
| 4562 | Eumundi, Doonan, Verrierdale |
| 4563 | Cooroy, Tinbeerwah |
| 4564 | Marcoola, Mudjimba, Pacific Paradise, Twin Waters |
| 4565 | Tewantin |
| 4566 | Noosaville |
| 4567 | Noosa Heads, Noosa Junction, Sunshine Beach |
| 4568 | Pomona, Cooran |
| 4569 | Cooroy area / Pinbarren |
| 4570 | Gympie fringe (incl. some hinterland — see note) |
| 4571 | Peregian Beach, Peregian Springs, Marcus Beach |
| 4572 | Coolum Beach, Mount Coolum, Yaroomba |
| 4573 | Coolum / Yandina Creek area |
| 4574 | Maleny / Conondale hinterland |
| 4575 | Kawana Waters, Buddina, Wurtulla, Warana, Bokarina, Birtinya |

> **Note on edge postcodes:** `4570` spans toward Gympie and `4574` toward the
> hinterland — both reach slightly beyond the core patch. If you only want the
> coastal strip, remove `4570` and/or `4574` from `config.js`.

## Suburb keywords (fallback)

Used when a postcode isn't present in the address string. Current list:

`Sunshine Coast`, `Caloundra`, `Maroochydore`, `Mooloolaba`, `Noosa`,
`Buderim`, `Nambour`, `Coolum`, `Peregian`, `Maleny`, `Kawana`, `Sippy Downs`,
`Mountain Creek`, `Twin Waters`, `Marcoola`.

These are intentionally high-signal, well-known suburb names. Add more (e.g.
`Pelican Waters`, `Bli Bli`, `Tewantin`, `Sunshine Beach`) if you want wider
coverage — note that broad/common words can cause false positives, so prefer
adding postcodes over generic keywords where possible.

## Changing the list

In `config.js`:

```js
sunshineCoast: {
  postcodes: [ "4550", ..., "4575" ],   // add/remove postcodes here
  suburbKeywords: [ "Caloundra", ... ], // add/remove suburb names here
}
```

No other file needs to change — `sunshineCoast.js` reads straight from config.
