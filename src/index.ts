import { AutomationCard, PropType, ws } from '@tnotifier/runtime';
import type { PropList, WS } from '@tnotifier/runtime';
import { Props, SpecialSources } from './types';
import { audioState } from './enums';

export default class extends AutomationCard.Action()<Props> {

    ws: WS;

    async mounted(): Promise<void> {
        const { id } = this.identity;

        try { 
            this.ws = await ws(id); 
        } catch(err) {
            throw new Error('Unable to connect to OBS Websocket');
        }

        await super.mounted();
    }

    async prepareProps(): Promise<PropList> {

        let defaultMic = '';
        const { mic1, mic2, mic3 } = (<SpecialSources>(await this.ws.send('GetSpecialSources')));
        const mics = [mic1, mic2, mic3];

        const micList = mics.reduce((obj: any, mic: string) => {

            if(mic === undefined) return obj;

            obj[mic] = {
                text: mic,
            }

            if(!defaultMic.length) { defaultMic = mic }

            return obj;
        }, {});

        return {
            mic: {
                type: PropType.Select,
                label: 'Microphone',
                default: defaultMic,
                options: micList,
            },
            action: {
                type: PropType.Select,
                default: audioState.TOGGLE,
                required: true,
                label: 'Action',
                help: 'Specify if you want to mute, unmute or toggle',
                options: {
                    [audioState.TOGGLE]: { text: 'Toggle', icon: 'sync' },
                    [audioState.MUTE]: { text: 'Mute', icon: 'do_not_disturb_alt'},
                    [audioState.UNMUTE]: { text: 'Unmute', icon: 'speaker' }
                }
            }
        };
    }

    async run(): Promise<void> {

        if(this.props.action === audioState.TOGGLE) {
            this.ws.send('ToggleMute', {
                'source': this.props.mic,
            });
            return;
        } 

        this.ws.send('SetMute', {
            'source': this.props.mic,
            'mute': !!(+this.props.action)
        });  
    }
}
