// Minimal DOM adapter for the existing VM editor tests. Real layout, node identity,
// checkbox events and rendering are verified in verify-candidate-tags.cjs.
export function tagOptionsNode() {
  return {
    innerHTML: "",
    insertAdjacentHTML(_position, html) { this.innerHTML += html; },
    querySelectorAll() {
      const row = this;
      return [...this.innerHTML.matchAll(/<button[^>]*data-area-tag-toggle="([^"]*)"[^>]*>.*?<\/button>/g)].map(match => ({
        dataset: { areaTagToggle: match[1] },
        remove() { row.innerHTML = row.innerHTML.replace(match[0], ""); },
        setAttribute(name, value) {
          row.innerHTML = row.innerHTML.replace(match[0], match[0].replace(new RegExp(`${name}="[^"]*"`), `${name}="${value}"`));
        },
      }));
    },
  };
}
