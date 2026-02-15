# MenuScene Not Showing on GitHub Pages - Fix Documentation

## Issue Summary
User deployed to GitHub Pages and reported seeing "Territory: 0.0% | Lives: 3" UI immediately, suggesting MenuScene was being skipped and GameScene auto-starting.

## Root Cause
The issue was NOT that MenuScene was being skipped. The problem was that the HTML UI container (`#ui-container`) was ALWAYS VISIBLE from page load, creating the illusion that GameScene had auto-started.

```html
<!-- BEFORE (WRONG) -->
<div id="ui-container">Territory: 0.0% | Lives: 3</div>
```

This made it appear that the game was already running, when in reality MenuScene was properly loading but was obscured by the always-visible UI.

## Fixes Implemented

### Fix #1: Hide UI Container By Default
**File**: `/Users/rohit/workspace/Pounce/index.html`

Added `display: none` to both CSS and inline style:
```css
#ui-container {
  display: none; /* Hidden by default, shown when GameScene starts */
}
```

```html
<div id="ui-container" style="display: none;">Territory: 0.0% | Lives: 3</div>
```

### Fix #2: Show UI When GameScene Starts
**File**: `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts`

Modified `create()` to show UI container:
```typescript
this.uiElement = document.getElementById('ui-container');
if (this.uiElement) {
  this.uiElement.style.display = 'block';
}
```

### Fix #3: Add Comprehensive Logging
Added console.log statements to track scene transitions:

**BootScene.ts**:
- Asset loading start/complete/error events
- Scene transition to MenuScene

**MenuScene.ts**:
- Scene creation
- START GAME button click

**GameScene.ts**:
- Scene creation

This allows users to verify scene flow in browser console.

## Scene Flow Verification

The correct scene flow is:
1. **BootScene** - Loads cat sprite assets (40 frames)
2. **MenuScene** - Shows title, subtitle, START GAME button, instructions
3. **GameScene** - Shows game UI and starts gameplay

With these fixes:
- On page load: Only MenuScene is visible (black background with Phaser text)
- After clicking START GAME: GameScene loads and HTML UI becomes visible

## Testing Checklist
- [x] Build completes without errors
- [x] HTML has display:none on ui-container
- [x] GameScene shows UI when it starts
- [x] Console logs track scene transitions
- [x] MenuScene Phaser text is visible (blue/green/gray on black background)

## Asset Loading
Cat sprite assets are correctly placed in:
- **Source**: `/Users/rohit/workspace/Pounce/public/assets/sprites/cat/`
- **Built**: `/Users/rohit/workspace/Pounce/dist/assets/sprites/cat/`
- **GitHub Pages URL**: `https://[user].github.io/Pounce/assets/sprites/cat/`

Vite config has correct base path: `base: '/Pounce/'`

## Debugging Steps for Users
If MenuScene still appears to be skipped:

1. Open browser console (F12)
2. Look for console logs:
   ```
   [BootScene] Starting asset preload...
   [BootScene] All assets loaded successfully
   [BootScene] Boot complete, transitioning to MenuScene
   [MenuScene] Menu scene started
   ```
3. If you see asset loading errors, check network tab for 404s
4. Verify MenuScene logs appear before GameScene logs
5. Check that HTML UI is hidden until START GAME is clicked

## Common Issues

### Issue: Assets fail to load on GitHub Pages
**Symptom**: Console shows "Failed to load asset" errors
**Solution**: Verify GitHub Pages is serving from correct branch and assets folder exists

### Issue: MenuScene text not visible
**Symptom**: Black screen after boot
**Solution**: Check that Phaser canvas is rendering - should see "POUNCE" title in blue

### Issue: UI shows immediately
**Symptom**: See "Territory: 0.0%" on page load
**Solution**: Already fixed - UI container now hidden by default

## Additional Improvements Made

### Error Handling
Added error listener to BootScene preload:
```typescript
this.load.on('loaderror', (fileObj: any) => {
  console.error('[BootScene] Failed to load asset:', fileObj.key, fileObj.src);
});
```

### Asset Loading Feedback
Added complete event listener:
```typescript
this.load.on('complete', () => {
  console.log('[BootScene] All assets loaded successfully');
});
```

## Files Modified
1. `/Users/rohit/workspace/Pounce/index.html` - Hide UI container
2. `/Users/rohit/workspace/Pounce/src/scenes/BootScene.ts` - Add logging and error handling
3. `/Users/rohit/workspace/Pounce/src/scenes/MenuScene.ts` - Add logging
4. `/Users/rohit/workspace/Pounce/src/scenes/GameScene.ts` - Show UI, add logging

## Commit Message
```
fix: hide game UI until GameScene starts (T011)

The HTML UI container was visible from page load, creating the
illusion that MenuScene was being skipped. Now UI is hidden by
default and shown when GameScene starts.

Also added comprehensive console logging to track scene transitions
and asset loading errors for easier debugging.

Fixes #T011
```
