export default function sleep(duration) {
  new Promise(resolve => setTimeout(resolve, duration));
}
