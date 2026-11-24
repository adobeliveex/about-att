# related-stories

Fills itself with stories related to the current page; authors only place the block. Each card shows the story image, title, description and a **Read More** link to the story.

## Authoring (Document Authoring)

Model: `standalone`

Add a **Related Stories** block. It needs no content. Optional key/value rows:

| Key | Default | Description |
| --- | --- | --- |
| `limit` | `3` | Number of cards to show |
| `source` | `/story/query-index.json` | Index to read stories from |

Put it in a section styled `blue` for the AT&T blue band with white cards.

## How stories are chosen

Data comes from the `stories` query index (`/story/**`, see the site's `query.yaml`), which reads each story's page metadata.

1. Leaves out the current page and stories whose **Exclude from Related** is `true`.
2. Scores the rest: same **Category** = 2, each shared **Tag** = 1.
3. Sorts by score, then **Related Priority** (lower number first; blank last), then newest **Publish Date**.
4. If fewer than `limit` stories share a category or tag, the newest other stories fill the gaps.
5. If there are no other stories, the block (and an otherwise empty section) is hidden.

## Supported variations

None.

## Universal Editor fields

N/A (Document Authoring project)
