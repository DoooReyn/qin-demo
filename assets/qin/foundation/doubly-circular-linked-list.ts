import { LinkedList } from "./linked-list";

/**
 * 双向环形链表节点
 * - 修改节点结构，增加prev指针
 */
export class DoublyListNode<T> {
  public value: T;
  public next: DoublyListNode<T> | null;
  public prev: DoublyListNode<T> | null;

  public constructor(value: T) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}

/**
 * 双向环形链表
 */
export class DoublyCircularLinkedList<T> extends LinkedList<T> {
  protected _head: DoublyListNode<T> | null;
  protected _tail: DoublyListNode<T> | null;

  public constructor() {
    super();
    this._head = null;
    this._tail = null;
  }

  /**
   * 添加元素到末尾（双向环形处理）
   */
  public append(value: T): void {
    const newNode = new DoublyListNode(value);

    if (!this._head) {
      this._head = newNode;
      this._tail = newNode;
      newNode.next = newNode;
      newNode.prev = newNode;
    } else {
      newNode.prev = this._tail;
      newNode.next = this._head;
      this._tail!.next = newNode;
      this._head!.prev = newNode;
      this._tail = newNode;
    }
    this._size++;
  }

  /**
   * 添加元素到头部（双向环形处理）
   */
  public prepend(value: T): void {
    const newNode = new DoublyListNode(value);

    if (!this._head) {
      this._head = newNode;
      this._tail = newNode;
      newNode.next = newNode;
      newNode.prev = newNode;
    } else {
      newNode.next = this._head;
      newNode.prev = this._tail;
      this._head!.prev = newNode;
      this._tail!.next = newNode;
      this._head = newNode;
    }
    this._size++;
  }

  /**
   * 在指定位置插入元素
   */
  public insertAt(index: number, value: T): boolean {
    if (index < 0 || index > this._size) return false;

    if (index === 0) {
      this.prepend(value);
      return true;
    }

    if (index === this._size) {
      this.append(value);
      return true;
    }

    const newNode = new DoublyListNode(value);
    let current = this._head;
    for (let i = 0; i < index - 1; i++) {
      current = current!.next;
    }

    newNode.next = current!.next;
    newNode.prev = current;
    current!.next!.prev = newNode;
    current!.next = newNode;
    this._size++;
    return true;
  }

  /**
   * 删除指定位置的元素
   */
  public removeAt(index: number): T | null {
    if (index < 0 || index >= this._size) return null;

    let removedValue: T;
    if (this._size === 1) {
      removedValue = this._head!.value;
      this._head = null;
      this._tail = null;
    } else if (index === 0) {
      removedValue = this._head!.value;
      this._head = this._head!.next;
      this._head!.prev = this._tail;
      this._tail!.next = this._head;
    } else if (index === this._size - 1) {
      removedValue = this._tail!.value;
      this._tail = this._tail!.prev;
      this._tail!.next = this._head;
      this._head!.prev = this._tail;
    } else {
      let current = this._head;
      for (let i = 0; i < index; i++) {
        current = current!.next;
      }
      removedValue = current!.value;
      current!.prev!.next = current!.next;
      current!.next!.prev = current!.prev;
    }

    this._size--;
    return removedValue;
  }

  /**
   * 清空链表（解除环形引用）
   */
  public clear(): void {
    if (this._head) {
      this._head.prev = null;
      this._tail!.next = null;
    }
    super.clear();
  }

  /**
   * 反向遍历链表
   */
  public forEachReversely(callback: (value: T, index: number) => void): void {
    if (!this._tail) return;

    let current = this._tail;
    let index = this._size - 1;

    do {
      callback(current.value, index);
      current = current.prev!;
      index--;
    } while (current !== this._tail && index >= 0);
  }
}
