/** Entry for the static offline bundle (scripts/build-demo-offline.mjs): same stage, no Next. */
import { createRoot } from 'react-dom/client'

import TramZStage from './TramZStage'

const el = document.getElementById('root')
if (el) createRoot(el).render(<TramZStage defaultSrc="events.jsonl" logoSrc="logo.svg" />)
