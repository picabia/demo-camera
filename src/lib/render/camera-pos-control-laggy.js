import { CameraPosControl } from '@picabia/picabia';

class CameraPosControlLaggy extends CameraPosControl {
  constructor (options, constraints) {
    super(constraints);

    options = options || {};
    this._lag = options.lag || 500;
    this._length = options.length || 100;

    this._values = [];
  }

  setValue (time, value) {
    super.setValue(time, value);
    this._values.push({time, value: this._nextValue});
    if (this._values.length > this._length) {
      this._values.shift();
    }
  }

  get updateRequired () {
    return this._updateRequired;
  }

  preRender (time) {
    if (this._values.length) {
      const filtered = this._values.filter((item) => time.t - item.time.t < this._lag);
      this._nextValue = filtered.length ? filtered[0].value : this._values[0].value;
      this._values = filtered;
    }
    const changed = !this._value || this._value.x !== this._nextValue.x || this._value.y !== this._nextValue.y;
    this._updateRequired = this._values.length;
    this._value = this._nextValue;
    return changed;
  }
}

export {
  CameraPosControlLaggy
};
