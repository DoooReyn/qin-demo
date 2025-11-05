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
  protected head: DoublyListNode<T> | null;
  protected tail: DoublyListNode<T> | null;

  public constructor() {
    super();
    this.head = null;
    this.tail = null;
  }

  /**
   * 添加元素到末尾（双向环形处理）
   */
  public append(value: T): void {
    const newNode = new DoublyListNode(value);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      newNode.next = newNode;
      newNode.prev = newNode;
    } else {
      newNode.prev = this.tail;
      newNode.next = this.head;
      this.tail!.next = newNode;
      this.head!.prev = newNode;
      this.tail = newNode;
    }
    this.size_++;
  }

  /**
   * 添加元素到头部（双向环形处理）
   */
  public prepend(value: T): void {
    const newNode = new DoublyListNode(value);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      newNode.next = newNode;
      newNode.prev = newNode;
    } else {
      newNode.next = this.head;
      newNode.prev = this.tail;
      this.head!.prev = newNode;
      this.tail!.next = newNode;
      this.head = newNode;
    }
    this.size_++;
  }

  /**
   * 在指定位置插入元素
   */
  public insertAt(index: number, value: T): boolean {
    if (index < 0 || index > this.size_) return false;

    if (index === 0) {
      this.prepend(value);
      return true;
    }

    if (index === this.size_) {
      this.append(value);
      return true;
    }

    const newNode = new DoublyListNode(value);
    let current = this.head;
    for (let i = 0; i < index - 1; i++) {
      current = current!.next;
    }

    newNode.next = current!.next;
    newNode.prev = current;
    current!.next!.prev = newNode;
    current!.next = newNode;
    this.size_++;
    return true;
  }

  /**
   * 删除指定位置的元素
   */
  public removeAt(index: number): T | null {
    if (index < 0 || index >= this.size_) return null;

    let removedValue: T;
    if (this.size_ === 1) {
      removedValue = this.head!.value;
      this.head = null;
      this.tail = null;
    } else if (index === 0) {
      removedValue = this.head!.value;
      this.head = this.head!.next;
      this.head!.prev = this.tail;
      this.tail!.next = this.head;
    } else if (index === this.size_ - 1) {
      removedValue = this.tail!.value;
      this.tail = this.tail!.prev;
      this.tail!.next = this.head;
      this.head!.prev = this.tail;
    } else {
      let current = this.head;
      for (let i = 0; i < index; i++) {
        current = current!.next;
      }
      removedValue = current!.value;
      current!.prev!.next = current!.next;
      current!.next!.prev = current!.prev;
    }

    this.size_--;
    return removedValue;
  }

  /**
   * 清空链表（解除环形引用）
   */
  public clear(): void {
    if (this.head) {
      this.head.prev = null;
      this.tail!.next = null;
    }
    super.clear();
  }

  /**
   * 反向遍历链表
   */
  public forEachReversely(callback: (value: T, index: number) => void): void {
    if (!this.tail) return;

    let current = this.tail;
    let index = this.size_ - 1;

    do {
      callback(current.value, index);
      current = current.prev!;
      index--;
    } while (current !== this.tail && index >= 0);
  }
}
