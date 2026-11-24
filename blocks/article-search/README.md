# article-search

Searchable, filterable listing of every newsroom article. It fills itself from the stories query index. Authors only place the block and can change its labels.

The block shows:

- A title. When a search term is present it reads *Search Results for "…"* instead.
- A search bar. It reads and keeps `?q=`, so the homepage search box can submit to this page.
- An optional intro sentence and an optional button link, such as *Subscribe to AT&T News*.
- A **left sidebar of filters** built from article metadata. On mobile it collapses behind a **Filters** button.
- Results, newest first. Each result shows its publish date, a title link and its description, with 20 results per page and **‹ Previous** / **Next ›** buttons.

## Authoring (Document Authoring)

Model: `standalone`

Add an **Article Search** block. Every row is an optional key/value pair:

| Key | Default | Description |
| --- | --- | --- |
| `title` | `All News Features` | Heading when nobody has searched |
| `intro` | (none) | Short helper text under the search bar |
| `link` | (none) | A link, shown as a cyan button (e.g. Subscribe to AT&T News) |
| `placeholder` | `Search news` | Search field placeholder |
| `filters` | `Category, Tags, Publish Month, Keywords, Author` | Which filters to show, in this order |
| `page size` | `20` | Results per page |
| `source` | `/story/query-index.json` | Index to read articles from |

## Filters

Filters come from each article's page metadata through the `stories` index (`/story/**`, see the site's `query.yaml`):

| Filter | Page metadata | URL parameter |
| --- | --- | --- |
| Category | `Category` | `category` |
| Tags | `Tags` (comma list) | `tag` |
| Publish month | `Publish Date` (YYYY-MM-DD) | `month` (YYYY-MM) |
| Keywords | `Keywords` (comma list) | `keyword` |
| Author | `Author` | `author` |

Matching rules:

- **Within a filter:** selected options match any of them (OR).
- **Across filters:** an article must match every filter that has a selection (AND).
- **Counts:** each option's count reflects the search term and the other filters.
- **Long lists:** the first 8 options show, with a *Show all* toggle for the rest.
- **Search term:** every word must appear somewhere in the article's title, description, category, tags, keywords or author.

The search term, filters and page are kept in the URL, for example `/allnews?q=holiday&category=wireless&month=2026-11`, so a results page can be shared or bookmarked.

## Supported variations

None.

## Universal Editor fields

N/A (Document Authoring project)
