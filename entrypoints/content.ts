export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("Loading contents script");

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "REQUEST_FORM_DATA") {
        const sanitizedBody = getSanitizedBody();
        const sanitizedBodyString = sanitizedBody.innerHTML.replaceAll("\n", "");

        chrome.runtime.sendMessage({
          type: "SANITIZED_FORM_DATA",
          data: sanitizedBodyString,
        });
      }

      if (request.type === "WRITE_FORM_DATA") {
        const { data } = request;

        const formFieldData = JSON.parse(data) as { label: string; selector: string; type: string; value: string }[];

        formFieldData.forEach((field) => {
          if (!field.selector) return;

          try {
            const element = document.querySelector(field.selector);
            if (element && "value" in element) {
              element.value = field.value;
              element.dispatchEvent(new Event("input", { bubbles: true }));
            }
          } catch (e) {
            console.error("Error setting form data", e);
          }
        });
      }
    });
  },
});

function getSanitizedBody(): HTMLElement {
  const acceptedTags = ["input", "form", "button", "label", "select", "textarea"];
  const acceptedAttributes = ["name", "type", "for", "value", "placeholder"];

  // Create a deep clone of the body
  const bodyClone = document.body.cloneNode(true) as HTMLElement;

  // Recursively process elements
  const stripElement = (element: Element) => {
    // Skip if not an element node
    if (element.nodeType !== Node.ELEMENT_NODE) return;

    // Check if the element should be stripped
    const isHiddenInput = element.tagName.toLowerCase() === "input" && element.getAttribute("type") === "hidden";
    if (!acceptedTags.includes(element.tagName.toLowerCase()) || isHiddenInput) {
      // Replace non-matching element or hidden input with its children
      const children = Array.from(element.children);
      element.replaceWith(...children);
      // Process the newly inserted children
      children.forEach(stripElement);
    } else {
      // Strip unwanted attributes
      const attributes = Array.from(element.attributes);
      attributes.forEach((attr) => {
        if (!acceptedAttributes.includes(attr.name)) {
          element.removeAttribute(attr.name);
        }
      });

      // Process children of matching elements
      Array.from(element.children).forEach(stripElement);
    }
  };

  stripElement(bodyClone);
  return bodyClone;
}
