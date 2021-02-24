# Search API

Couchers has two types of searches: full text search, and trigram-based fuzzy search.

Full text is powered by built-in postgres functionality:
https://www.postgresql.org/docs/current/textsearch.html

Trigram based search is powered by the built-in pg_trgm module:
https://www.postgresql.org/docs/current/pgtrgm.html

## Full text search

Full text search divides the text into lexemes and matches against dictionaries, etc, to find exact word matches against "standardized words" (so different forms of the same word match). Here's an example:

```
# select to_tsvector('This is an example sentence.');
      to_tsvector
------------------------
 'exampl':4 'sentenc':5
(1 row)
```

Stop words (short words that aren't useful for search, e.g. 'this', 'is', 'an') are eliminated, punctuation is discarded, and the rest of the words are standardized into lexemes, so 'example' goes to 'exampl', etc.

This allows indexing large document and matching up words exactly. For example, the following query would match:

```
# select websearch_to_tsquery('examples of sentences');
 websearch_to_tsquery
----------------------
 'exampl' & 'sentenc'
(1 row)
```

We get a match:

```
# select to_tsvector('This is an example sentence.') @@ websearch_to_tsquery('examples of sentences');
 ?column?
----------
 t
(1 row)
```

Note that full text search is very language dependent in addition to using dictionaries. We're currently using English. It's not therefore good for words that aren't "Englishy" and not in the dictionary, for example local place names.

Read more on postgres docs:

https://www.postgresql.org/docs/current/textsearch.html

### Implementation details

We use the A/B/C/D for ranking, where each different searchable type has different sets of A/B/C/D. A is normally the title of the entity, e.g. the name of the community, the name of the user (or their username), page title, etc. B is normally the address or the user's typed in city, etc. C is any other primary text that's more important than just the content. D is all other text, main content, etc.

We use `websearch_to_tsquery` to turn an input into a `tsquery`. It's safe to use with user-supplied input, and it does the following to text

* unquoted text requires each word to be in the search
* quoted text requries each word to appear consequtively in the text
* supports `or` and `-` (for negation)


## Trigram search (fuzzy search)

Trigram search works by breaking up words into consequtive triplets of characters, then looking these up in a reverse search. With the right indexes, this scales to insane size and can be even used to implement indexed regular expressions over huge sets of text, etc.

A sentence turned into trigrams:

```
# select show_trgm('This is an example sentence.');
                                                                 show_trgm
-------------------------------------------------------------------------------------------------------------------------------------------
 {"  a","  e","  i","  s","  t"," an"," ex"," is"," se"," th",amp,"an ","ce ",enc,ent,exa,his,"is ","le ",mpl,nce,nte,ple,sen,ten,thi,xam}
(1 row)
```

Search query with spelling error

```
# select show_trgm('example sentnences');
                                         show_trgm
-------------------------------------------------------------------------------------------
 {"  e","  s"," ex"," se",apl,ces,enc,ent,"es ",exm,"le ",map,nce,nen,ntn,ple,sen,tne,xma}
(1 row)
```

Now we can match against it:

```
# select word_similarity('example sentnences', 'This is an example sentence.');
 word_similarity
-----------------
       0.6666667
(1 row)
```

Note that full text search would not match due to the spelling mistake:

```
# select to_tsvector('This is an example sentence.') @@ websearch_to_tsquery('example sentnences');
 ?column?
----------
 f
(1 row)
```

Good on placenames:

```
# select word_similarity('joens', 'Joensuu, Finland');
 word_similarity
-----------------
       0.8333333
(1 row)
```

Trigram search is much better for fuzzy matching, but it doesn't understand text at all, so it's not ideal for proper full text search, and it's a bit trickier to rank large documents.

However, it should be very good for searching short titles/addresses, and we use it against the A list from above.

Read more on postgres docs:

https://www.postgresql.org/docs/current/pgtrgm.html


### Implementation details

We use `unaccent` first on the query and text to be queried to remove accents and normalize text before trigram search.

We match against the A list only.

The trigram similarity is weighted a bit higher than the text search results, this might need to be tweaked.
