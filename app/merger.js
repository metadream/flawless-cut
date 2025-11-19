const { basename } = require('path')

module.exports = class {

  constructor() {
    this.container = $(`
      <div class="merger">
        <div class="content">
          <div class="title">File List</div><ol></ol>
        </div>
        <div class="footer">
          <button class="merge">Merge</button>
          <button class="cancel">Cancel</button>
        </div>
      </div>
    `)

    this.fileList = this.container.$('ol')
    this.mergeBtn = this.container.$('button.merge')
    this.cancelBtn = this.container.$('button.cancel')
    document.body.appendChild(this.container)

    this.mergeBtn.onclick = () => {
      this.onmerge()
    }
    this.cancelBtn.onclick = () => {
      this.container.style.display = 'none'
    }
  }

  setFileList(filePaths) {
    this.container.style.display = 'flex'
    this.fileList.innerHTML = ''

    filePaths.forEach(filePath => {
      this.fileList.appendChild($('<li>' + basename(filePath) + '</li>'))
    })
  }

}