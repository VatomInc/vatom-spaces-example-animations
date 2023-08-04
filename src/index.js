import { BasePlugin, BaseComponent } from 'vatom-spaces-plugins'

/**
 * This is the main entry point for your plugin.
 *
 * All information regarding plugin development can be found at
 * https://developer.vatom.com/spaces/plugins-in-spaces/guide-create-plugin
 *
 * @license MIT
 * @author Vatom Inc.
 */
export default class MyPlugin extends BasePlugin {

    /** Plugin info */
    static id = "com.vatom.example.animations"
    static name = "Example Animations"
    static description = "Shows an example playing and blending animations on an object."

    /** Called on load */
    onLoad() {

        // Create a button in the toolbar
        this.menus.register({
            icon: this.paths.absolute('button-icon.png'),
            text: 'Animation Test',
            action: () => this.onButtonPress()
        })

    }

    /** Toast status */
    async showStatus(text) {

        // Remove last toast if any, wait for the
        if (this._toast) {
            this.menus.closeToast(this._toast)
            this._toast = null
            await new Promise(c => setTimeout(c, 750))
        }

        // Show new toast if needed
        if (text) {
            this._toast = await this.menus.toast({ text, isSticky: true })
        }

    }

    /** Called when the user presses the action button */
    async onButtonPress() {

        // Only run once at a time
        if (this._running) return
        this._running = true

        // Add the NPC
        this.showStatus('NPC: Idle')
        let userPos = await this.user.getPosition()
        let npcID = await this.objects.create({

            // Model info
            type: 'model',
            url: this.paths.absolute('npc.glb'),

            // Location
            x:      userPos.x,
            height: userPos.y,
            y:      userPos.z,

            // Animations, default to idle
            animation: [
                { name: 'humanoid.idle', weight: 1, loop: Number.POSITIVE_INFINITY },
                { name: 'humanoid.walk', weight: 0, loop: Number.POSITIVE_INFINITY },
            ],

        })

        // Stay idle for 5 seconds
        await new Promise(c => setTimeout(c, 5000))

        // Fade to the walk animation and wait 5 seconds
        this.showStatus('NPC: Walking')
        await this.fadeAnimation(npcID, 'humanoid.idle', 'humanoid.walk', 2000)
        await new Promise(c => setTimeout(c, 5000))

        // Freeze the walk animation and wait 5 seconds
        this.showStatus('NPC: Walking (freeze)')
        this.objects.update(npcID, {
            animation: [
                { name: 'humanoid.walk', weight: 1, loop: 1 },
                { name: 'humanoid.idle', weight: 0, loop: Number.POSITIVE_INFINITY },
            ]
        }, true)
        await new Promise(c => setTimeout(c, 5000))

        // Unfreeze the animation and wait 5 seconds
        this.showStatus('NPC: Walking')
        this.objects.update(npcID, {
            animation: [
                { name: 'humanoid.walk', weight: 1, loop: Number.POSITIVE_INFINITY },
                { name: 'humanoid.idle', weight: 0, loop: Number.POSITIVE_INFINITY },
            ]
        }, true)
        await new Promise(c => setTimeout(c, 5000))

        // Fade to the idle animation and wait 5 seconds
        this.showStatus('NPC: Idle')
        await this.fadeAnimation(npcID, 'humanoid.walk', 'humanoid.idle', 2000)
        await new Promise(c => setTimeout(c, 5000))

        // Done, remove the NPC
        this.showStatus()
        this.objects.remove(npcID)
        this._running = false

    }

    // Fade animations
    async fadeAnimation(objectID, fromName, toName, duration) {

        // Loop
        let startedAt = Date.now()
        while (startedAt + duration > Date.now()) {
    
            // Get fade amount
            let fade = (Date.now() - startedAt) / duration
    
            // Update object
            this.objects.update(objectID, {
                animation: [
                    { loop: Number.POSITIVE_INFINITY, name: fromName, weight: 1 - fade },
                    { loop: Number.POSITIVE_INFINITY, name: toName, weight: fade },
                ]
            }, true)
    
            // Wait for next frame
            await new Promise(c => requestAnimationFrame(c))
    
        }
    
    }

}
