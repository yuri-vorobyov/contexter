# contexter

Puts user input into context using public full-text search APIs.

Try it here:

https://yuri-vorobyov.github.io/contexter/

The main feature of this app is the mechanism of communication with APIs. There are two APIs providing fulltext search capabilities. Both return data in chunks, and multiple requests are necessary to get all search results. Therefore, asyncronous programming is utilized heavily. The main pattern is an asyncronous generator which takes an array of promises and each time yields the one most recently fulfilled (or rejected). Multiple generators can be combined into one which simplifies the usage of several APIs.
