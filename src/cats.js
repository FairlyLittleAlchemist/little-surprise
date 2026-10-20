// Pixel cats from LuizMelo's "Pet Cats Pack" (CC0), see CREDITS.md.
// Each sheet is a row of 50×50 frames; cats face right and their feet sit at y=32.
const FRAME = 50, SCALE = 4;
export const CAT_SIZE = FRAME * SCALE;    // element is 200×200 (see .cat in style.css)
export const FEET = 32 * SCALE;           // px from element top down to the paws

const ANIMS = {
  idle: [10, 8], walk: [8, 10], run: [8, 14], laying: [8, 9], sleeping1: [1, 1],
  meow: [4, 7], sitting: [1, 1], licking1: [5, 6],
};

export class Cat {
  constructor(skin) {
    this.skin = skin;
    this.el = document.createElement('div');
    this.el.className = 'cat';
    this.sprite = document.createElement('div');
    this.sprite.className = 'cat-sprite';
    this.el.append(this.sprite);
  }

  // play('walk') loops; play('laying', { then: 'sleeping1' }) plays once, then switches.
  play(name, { then } = {}) {
    clearInterval(this.timer);
    const [frames, fps] = ANIMS[name];
    this.current = name;
    this.sprite.style.backgroundImage = `url(${import.meta.env.BASE_URL}cats/${this.skin}-${name}.png)`;
    this.sprite.style.backgroundSize = `${frames * CAT_SIZE}px ${CAT_SIZE}px`;
    let f = 0;
    const draw = () => (this.sprite.style.backgroundPositionX = `${-f * CAT_SIZE}px`);
    draw();
    if (frames === 1) return;
    this.timer = setInterval(() => {
      f++;
      if (f === frames) {
        if (then) return this.play(then);
        f = 0;
      }
      draw();
    }, 1000 / fps);
  }

  destroy() { clearInterval(this.timer); this.el.remove(); }

  face(dir) { this.sprite.style.transform = dir === 'left' ? 'scaleX(-1)' : ''; }

  // meow, then go back to whatever the cat is "resting" in (sleeping1, sitting…)
  meow() {
    if (this.current === 'meow' || !this.rest) return;
    this.play('meow', { then: this.rest });
    const bubble = document.createElement('div');
    bubble.className = 'meow';
    bubble.textContent = 'mew!';
    this.el.append(bubble);
    setTimeout(() => bubble.remove(), 900);
  }
}
