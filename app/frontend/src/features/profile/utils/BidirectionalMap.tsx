/**
 * This bidirectional map only has get functions and no add,
 * update, delete, size, has functions because those functions
 * aren't anywhere.
 *
 * There's also a guarantee that get and getKey will always
 * have a value returned and not null, because those are
 *
 */
export default class BiDirectionalMap<K, V> {
  public forwardMap = new Map<K, V>();
  public reverseMap = new Map<V, K>();

  constructor(entries: Array<[K, V]>) {
    this.forwardMap = new Map(entries);
    this.reverseMap = new Map(entries.map(([k, v]): [V, K] => [v, k]));
  }

  public get(key: K): V {
    return this.forwardMap.get(key) as V;
  }
  public getKey(value: V): K {
    return this.reverseMap.get(value) as K;
  }
}
