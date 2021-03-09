import nav from './nav.js'
import {styles} from './load.js'

addEventListener('load', install)

function install() {
  styles('/nav.css', 'prepend')
  nav(window)
}
