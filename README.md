# Echoes of Liora

A peaceful top-down 32-bit inspired exploration prototype built with HTML5, CSS3, JavaScript, Phaser 3, and tilemap-driven world composition. The outdoor map uses a classic top-down 3/4 adventure view with mostly horizontal/vertical terrain, depth from shadows and foreground layers, free walking, collision obstacles, and a custom animated hero with visible arm and foot motion.

## Run

```bash
npm run dev
```

Then open `http://127.0.0.1:5173`.

Phaser 3 is loaded from the jsDelivr CDN in `index.html`, while all game code and generated placeholder pixel art live in this repository.

## Controls

- Move freely through the open map: Arrow keys or WASD
- Interact / inspect: E or Space
- Enter houses from glowing door prompts
- Leave interiors by walking through the bottom doorway

## Prototype scope

This prototype intentionally contains no combat, enemies, damage, weapons, survival mechanics, inventory, or quests. Its architecture leaves room for future enemies, quests, NPC schedules, inventory, combat, and day/night systems while focusing now on exploration, atmosphere, discovery, and handcrafted-feeling spaces.
