export default class CustomPaletteProvider {
  constructor(palette, create, elementFactory, globalConnect) {
    this.create = create;
    this.elementFactory = elementFactory;
    this.globalConnect = globalConnect;

    palette.registerProvider(this);
  }

  getPaletteEntries(element) {
    return function(entries) {
      // Remove the custom attachment tool
      // delete entries['create.attachment-task'];

      return entries;
    };
  }
}

CustomPaletteProvider.$inject = ['palette', 'create', 'elementFactory', 'globalConnect'];
