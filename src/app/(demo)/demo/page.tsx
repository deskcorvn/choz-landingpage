import TramZStage from '@/components/tram-z-stage/TramZStage'

/** /demo — "Một ngày của Trạm Z". Data comes from /public/demo (or ?src= / ?ws=); the page calls no API. */
export default function DemoPage() {
  return <TramZStage defaultSrc="/demo/events.jsonl" logoSrc="/images/miniapp/logo.svg" />
}
