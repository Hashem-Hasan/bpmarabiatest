import { assign } from 'min-dash';

export default function CustomContextPad(
  contextPad, modeling, elementRegistry, bpmnFactory, translate
) {
  this._contextPad = contextPad;
  this._modeling = modeling;
  this._elementRegistry = elementRegistry;
  this._bpmnFactory = bpmnFactory;
  this._translate = translate;

  contextPad.registerProvider(this);
}

CustomContextPad.$inject = [
  'contextPad',
  'modeling',
  'elementRegistry',
  'bpmnFactory',
  'translate'
];

CustomContextPad.prototype.getContextPadEntries = function(element) {
  const { _modeling, _bpmnFactory } = this;

  function attachFile(event) {
    event.stopPropagation();

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = function(evt) {
        const content = evt.target.result;
        const businessObject = element.businessObject;

        if (!businessObject.attachments) {
          businessObject.attachments = [];
        }

        businessObject.attachments.push({
          name: file.name,
          type: file.type,
          content: content,
        });

        _modeling.updateProperties(element, {
          attachments: businessObject.attachments
        });
      };
      reader.readAsDataURL(file);
    };

    fileInput.click();
  }

  return function(entries) {
    return assign(entries, {
      'attach-file': {
        group: 'tools',
        className: 'bpmn-icon-attachment',
        title: 'Attach File',
        action: {
          click: attachFile
        }
      }
    });
  };
};
