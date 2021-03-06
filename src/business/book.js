/**
 * @description: this file contains the Book buisness object, in the context of a given http request
 *
 * This file will handle batching and caching, as well a http authentication, scoping and so on
 *
 * @flow
 */
import DataLoader from 'dataloader';
import BookModel from '../db/queryBuilders/book';

class Book {
  id: $PropertyType<BookDBType, 'id'>;
  name: $PropertyType<BookDBType, 'name'>;
  author: $PropertyType<BookDBType, 'author'>;
  // eslint-disable-next-line no-unused-vars
  constructor(data: BookDBType, viewer: { id?: string }) {
    this.id = data.id;
    this.name = data.name;
    this.author = data.author;
  }
  // get the loader for the request, in order to batch and cach the db calls
  // https://github.com/facebook/dataloader#loading-by-alternative-keys
  static getLoaders() {
    const primeLoaders = (books: Array<BookDBType>) => {
      for (let book of books) {
        //book.bamerBorrowingId && byBorrowingUserId.prime(book.bamerBorrowingId, book);
        byId.prime(book.id, book);
      }
    };
    const byId = new DataLoader(ids => BookModel.getByListofIds(ids));
    // Fix me : this loader does not work
    // DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise of an Array of the same length as the Array of keys.
    // const byBorrowingUserId = new DataLoader(ids => BookModel.getByBorrowerId(ids));
    return {
      byId,
      //byBorrowingUserId,
      primeLoaders,
    };
  }
  static async load({ user: viewer, dataloaders }, id): Promise<?Book> {
    // return null if no id is given
    if (!id) return null;
    // return null if no id is given
    const data = await dataloaders.book.byId.load(id);
    dataloaders.book.primeLoaders(data);
    if (!data) return null;

    return new Book(data, viewer);
  }
  static async loadByBorrowing({ user: viewer, dataloaders }, id): Promise<Array<Book>> {
    // return null if no id is given
    if (!id) return [];
    // return null if no id is given
    // @todo : refactore this to use loader
    const data = await BookModel.getByBorrowerId(id);
    dataloaders.book.primeLoaders(data);
    if (!data) return [];

    return data.map(row => new Book(row, viewer));
  }
  static async loadAll({ user: viewer, dataloaders }): Promise<Array<Book>> {
    const data = await BookModel.getAll();
    dataloaders.book.primeLoaders(data);
    return data.map(row => new Book(row, viewer));
  }
}

export default Book;
