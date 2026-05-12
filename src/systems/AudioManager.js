export class AudioManager {
  constructor(scene) {
    this.scene = scene;
  }

  createHooks() {
    this.hooks = {
      music: 'ambient-music-loop',
      water: 'lake-water-loop',
      footsteps: 'soft-grass-footsteps',
      wind: 'forest-wind-bed',
      birds: 'distant-birds-random',
    };
  }

  playAmbientBed() {
    // Placeholder for future WebAudio/asset-backed ambience. Kept explicit so content can be dropped in later.
    this.createHooks();
  }
}
