export class TransformPipe {
  private transforms: Array<mp.NodeTransform<any>> = [];

  public add(transform: mp.NodeTransform<any>): this {
    if (!transform) throw new Error('Invalid transform argument');
    this.transforms.push(transform);
    return this;
  }

  public remove(transform: mp.NodeTransform<any>): this {
    const i = this.transforms.indexOf(transform);
    if (i > 0) this.transforms[i] = null;
    else throw new Error('Transform argument doesn\'t exist');
    return this;
  }

  public apply(tree: mp.MarkupTree): any {
    if (!tree) throw new Error('Invalid tree argument');
    const newTransform = [];
    let lastResult = tree;
    for (const t of this.transforms) {
      if (t) {
        newTransform.push(t);
        lastResult = t.transform(lastResult);
      }
    }

    this.transforms = newTransform;
    return lastResult;
  }
}