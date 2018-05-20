import { Model, Emitter, Time, Geometry, Granular, Wave } from '@picabia/picabia';

const ACCELERATION_INCREMENT = 0.0001;
const BREAKING_INCREMENT = 0.002;
const STOP_INCREMENT = 0.0001;
const AIR_STOP_INCREMENT = 0.00001;
const MAX_MOVE_SPEED = 1.5;

const TURN_INCREMENT = 0.00001;
const MAX_TURN_ANGLE = Math.PI / 200;

const DASH_INCREMENT = 0.0005;
const DASH_DECREMENT = 0.0007;
const MAX_DASH_SPEED = 0.5;

const MIN_JUMP_SPEED = 0.2;
const MIN_JUMP_FORCE = 2;
const JUMP_INCREMENT = 0.005;
const MAX_JUMP_FORCE = 6;
const JUMP_V_SPEED = 0.01;
const GRAVITY = 0.0001;

class PlayerModel extends Model {
  constructor () {
    super();

    this._pos = { x: 0, y: 0 };
    this._dir = 0;
    this._turnAngle = 0;
    this._facing = 0;
    this._speed = 0;
    this._height = 0;
    this._jumpForce = 0;
    this._vSpeed = 0;
    this._lateralAcceleration = 0;

    this._shape = [{ x: -50, y: -50 }, { x: 0, y: -75 }, { x: 50, y: -50 }, { x: 50, y: 50 }, { x: -50, y: 50 }];

    this._moveSpeed = 0;
    this._dashSpeed = 0;

    this._acceleration = 0;
    this._dashing = 0;
    this._turn = 0;
    this._jumping = false;

    this._jumpHeight = 0;
    this._jumpForce = 0;
    this._jumpTime = 0;

    this._emitter = new Emitter();
    Emitter.mixin(this, this._emitter);
  }

  // -- model

  _init (time) {
    this._log = Time.throttleAF(() => {
      // console.log(Math.round(this._lateralAcceleration * 10000));
    }, 250);

    this._oscillator1 = Wave.triangle(time.t, 0, Math.PI / 1000, 200);
  }

  _preUpdate () {
    const timestamp = this._time.t;
    const delta = this._time.d;

    this._log();

    if (!this._height && this._acceleration > 0) {
      this._moveSpeed += delta * ACCELERATION_INCREMENT;
      if (this._moveSpeed >= MAX_MOVE_SPEED) {
        this._moveSpeed = MAX_MOVE_SPEED;
      }
    } else {
      if (this._dashSpeed > 0) {
        this._dashSpeed -= delta * DASH_DECREMENT;
        if (this._dashSpeed <= 0) {
          this._dashSpeed = 0;
        }
      }
      if (!this._height && this._acceleration < 0) {
        this._moveSpeed -= delta * BREAKING_INCREMENT;
        if (this._moveSpeed <= 0) {
          this._emitter.emit('break', this);
          this._moveSpeed = 0;
        }
      } else if (!this._height && this._moveSpeed) {
        this._moveSpeed -= delta * STOP_INCREMENT;
        if (this._moveSpeed <= 0) {
          this._emitter.emit('stop', this);
          this._moveSpeed = 0;
        }
      } else if (this._moveSpeed) {
        this._moveSpeed -= delta * AIR_STOP_INCREMENT;
        if (this._moveSpeed <= 0) {
          this._moveSpeed = 0;
        }
      }
    }

    if (!this._height && this._dashing) {
      this._dashSpeed += delta * DASH_INCREMENT;
      if (this._dashSpeed >= MAX_DASH_SPEED) {
        this._dashSpeed = MAX_DASH_SPEED;
      }
    }

    if (!this._dashing && this._acceleration > 0 && this._dashSpeed) {
      this._dashSpeed -= delta * DASH_DECREMENT;
      if (this._dashSpeed <= 0) {
        this._dashSpeed = 0;
      }
    }

    this._speed = this._moveSpeed + this._dashSpeed;

    if (this._jumping && this._speed > MIN_JUMP_SPEED) {
      if (!this._jumpTime) {
        this._jumpTime = timestamp;
        this._emitter.emit('jump-start', this);
      }
      this._jumpForce += (this._jumpForce ? delta * JUMP_INCREMENT : MIN_JUMP_FORCE);
      const jumpForceFactor = this._speed * 2 / (MAX_MOVE_SPEED + MAX_DASH_SPEED);
      if (this._jumpForce >= MAX_JUMP_FORCE * jumpForceFactor) {
        this._emitter.emit('jump-stop', this);
        this._jumpForce = 0;
        this._jumping = false;
      }
      this._vSpeed = this._jumpForce * JUMP_V_SPEED;
      this._jumpForce = Math.max(this._jumpForce, this._jumpForce);
    }

    this._height += this._vSpeed * delta;

    if (this._height) {
      this._jumpHeight = Math.max(this._jumpHeight, this._height);
      if (!this._jumping) {
        this._vSpeed -= delta * GRAVITY;
        if (this._height < 0) {
          this._height = 0;
          this._vSpeed = 0;
          this._emitter.emit('jump-land', this);
          this._jumpHeight = 0;
          this._jumpForce = 0;
          this._jumpTime = 0;
        }
      }
    }

    const notStearing = !this._turn;
    const stearingOpposite = Math.sign(this._turnAngle) !== Math.sign(this._turn);
    if (!this._height && this._turnAngle && this._speed && notStearing) {
      this._turnAngle *= (0.99 * (1 - Math.min(this._speed, 2) / 3)) ** (delta / 100);
    }
    if (!this._height && this._turnAngle && this._speed && stearingOpposite) {
      this._turnAngle *= (0.99 * (1 - Math.min(this._speed, 1) / 10)) ** (delta / 200);
    }
    if (!this._height && this._turn && this._speed) {
      this._turnAngle += this._turn * delta * TURN_INCREMENT;
      if (Math.abs(this._turnAngle) > MAX_TURN_ANGLE) {
        this._turnAngle = MAX_TURN_ANGLE * Math.sign(this._turnAngle);
      }
    }
    if (this._turnAngle && this._speed) {
      this._dir += this._turnAngle * Math.min(this._speed, 1);
    }
    if (!Granular.zero(this._turnAngle)) {
      this._lateralAcceleration = this._turnAngle * this._speed;
    } else {
      this._lateralAcceleration *= 0.9 ** (delta / 10);
    }

    this._dir += this._oscillator1(this._time.t);

    const dir = Geometry.radiansToVector(this._dir);

    if (this._speed && dir.x) {
      this._pos.x += dir.x * this._speed * delta;
    }
    if (this._speed && dir.y) {
      this._pos.y += dir.y * this._speed * delta;
    }

    if (this._speed) {
      this._emitter.emit('moving', this);
    }

    if (this._vSpeed) {
      this._emitter.emit('jumping', this);
    }

    if (this._speed && this._facing !== this._dir) {
      let diff = this._dir - this._facing;
      if (Math.abs(diff) > Math.PI) {
        this._facing += Math.sign(diff) * Math.PI * 2;
        diff = this._dir - this._facing;
      }
      if (Math.abs(diff) < 0.2) {
        this._facing = this._dir;
      } else {
        this._facing += (diff) * 0.1;
      }
    }

    this._log(delta, timestamp, this._facing);
  }

  _destroy () {
    this._emitter.destroy();
  }

  // -- api

  setPos (x, y) {
    this._pos = {
      x,
      y
    };
  }

  setAcceleration (acceleration) {
    this._acceleration = acceleration;
  }

  startDash () {
    this._dashing = 1;
  }

  stopDash () {
    this._dashing = 0;
  }

  setTurn (turn) {
    this._turn = turn;
  }

  startJump () {
    if (!this._height) {
      this._jumping = true;
    }
  }

  stopJump () {
    this._jumping = false;
    this._jumpForce = 0;
  }
}

export {
  PlayerModel
};
