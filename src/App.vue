<template>
  <div id="app" :class="theme">
    <div class="container">
      <div class="page">
        <header>
          <img src="https://www.entre-geeks.com/medias/fb.png" alt="">
          <div class="options">
            <p class="comment">Thème :</p>
            <div class="fieldset">
              <input type="radio" id="dark" value="dark" v-model="theme"><label for="dark" class="radio_label">Sombre</label>
              <input type="radio" id="light" value="light" v-model="theme"><label for="light" class="radio_label">Clair</label>
            </div>
          </div>
        </header>
        <p class="presentation">Salut !<br>Ici tu peux créer des cartes pour compléter le deck qu'on utilise pour les parties de Limite-Limite organisée sur Entre-Geeks !</p>
        <p class="instruction">Ton pseudo : <span class="comment">(tu n'es pas obligé(e) de le donner) </span><br><input type="text" v-model="author" class="author"></p>
        <p class="instruction">
          Type :
          <input type="radio" id="question" value="question" v-model="type"><label for="question" class="radio_label">Question </label>
          <input type="radio" id="answer" value="answer" v-model="type"><label for="answer" class="radio_label">Réponse</label>
          <br>
          <span class="comment" v-if="type === 'question'">Pour insérer un blanc, ajoute 2 crochets [ ]</span>
        </p>
        <div class="fieldset">
        </div>
        <div class="fieldset">
          <div class="card">
            <textarea-autosize ref="new_card" placeholder="Texte de la carte ..." v-model="new_card_text"></textarea-autosize>
              <span class="type">{{type === 'question' ? 'Quest.' : 'Rép.'}}</span>
            <button class="check" title="Valider" @click="save()">Valider<i class="icon"></i></button>
            <div class="loader_container" v-if="adding_card_loader"><div class="loader"></div></div>
          </div>
        </div>
        <div class="created">
          <p class="instruction">Cartes créées ({{cards.length}}) :</p>
          <div class="cards">
            <div class="card" v-for="card in cards" :key="'card_' + card.id">
              <p class="card_text" v-html="white_space(card.text)" v-if="!card.edit"></p>
              <textarea-autosize ref="edit_card" placeholder="Texte de la carte ..." v-model="card_editing_text" v-if="card.edit"></textarea-autosize>
              <span class="type editable" @click="change_type(card.id)">{{card.type === 'question' ? 'Quest.' : 'Rép.'}}</span>
              <button class="edit" title="Modifier" @click="edit(card.id)" v-if="!card.edit" :key="'edit' + card.id">Modifier<i class="icon"></i></button>
              <button class="delete" :class="card.edit ? 'cancel' : ''" title="Supprimer" @click="remove(card.id, card.edit)" :key="'remove' + card.id">Supprimer<i class="icon"></i></button>
              <button class="check" title="Valider" @click="save(card.id)" v-if="card.edit" :key="'check' + card.id">Valider<i class="icon"></i></button>
              <div class="loader_container" v-if="card_editing_loader === card.id"><div class="loader"></div></div>
            </div>
          </div>
        </div>
      </div>
      <footer class="comment">Un problème ? Envoi un mp à Ceos !</footer>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'app',
  data () {
    return {
      cards: [],
      theme: 'dark',
      new_card_text: '',
      new_card_height: 0,
      author: '',
      type: 'question',
      adding_card_loader: false,
      card_editing_text: '',
      card_editing_loader: 0
    }
  },
  components: {
  },
  methods: {
    white_space (text) {
      var txt = text;
      var ws = '<span class="white_space"></span>';
      while (txt.indexOf('[ ]') !== -1 || txt.indexOf('[]') !== -1) {
        txt = txt.replace('[ ]', ws).replace('[]', ws);
      }
      return txt;
    },
    save (id, change_type) {
      if ((id && this.card_editing_text === '' && !change_type) || (!id && this.new_card_text === '')) {
        return;
      }
      var self = this;
      var card = null;
      if (id) {
        card = this.cards.find(function (c) {
          return c.id === id;
        });
      }
      this.adding_card_loader = id ? false : true;
      this.card_editing_loader = id;
      this.doc_blur();
      window.setTimeout(function () {
        self.request({
          operation: 'save_card',
          id: id ? card.id : '',
          type: id ? card.type : self.type,
          text: id ? (change_type ? card.text : self.card_editing_text) : self.new_card_text,
          token: id ? card.token : '',
          author: self.author
        }, self.saved, {id: id, change_type});
      },200);
    },
    saved(datas, params) {
      if (datas.id) {
        var card = null;
        var self = this;
        if (params.id) {
          //edit card
          this.cards = this.cards.map(function (c) {
            if (c.id === params.id) {
              c.text = params.change_type ? c.text : self.card_editing_text;
              c.edit = false;
              card = c;
            }
            return c;
          })
        } else {
          //create new card
          card = {text: this.new_card_text, type: this.type, id: datas.id, token: datas.token};
          this.cards.push(card);
        }
        this.new_card_text = params.id ? this.new_card_text : '';
        this.card_editing_text = '';
      }
      this.adding_card_loader = false;
      this.card_editing_loader = false;
    },
    edit (id) {
      var self = this;
      this.cards = this.cards.map(function (c) {
        c.edit = c.id === id;
        if (c.id === id) {
          self.card_editing_text = c.text;
        }
        return c;
      });
    },
    remove (id, cancel) {
      if (!cancel && !confirm('Supprimer la carte ?')) {
        return;
      }
      var self = this;
      this.card_editing_loader = cancel ? this.card_editing_loader : id;
      this.doc_blur();
      var card = this.cards.find(function (c) { return c.id === id;});
      if (cancel) {
        card.edit = false;
        this.card_editing_text = '';
      } else {
        window.setTimeout(function () {
          self.request({
            operation: 'remove_card',
            id: id,
            token: id ? card.token : ''
          }, self.removed, {id: id});
        },200);
      }
    },
    removed (datas) {
      this.card_editing_loader = 0;
      if (datas.id) {
        this.cards = this.cards.filter(function (c) {
          return c.id != datas.id;
        });
      }
    },
    change_type (id) {
      var card = this.cards.find(function (c) {
        return c.id === id;
      });
      console.log(card)
      card.type = card.type === 'question' ? 'answer' : 'question';
      this.save(id, true);
    },
    doc_blur() {
      this.$nextTick(function () {
        document.activeElement.blur();
      });
    },
    request (datas, callback, callback_params) {
      var self = this;
      axios.post(
        this.$serv + 'xmlhttp.php',
        datas
      ).then(function (response) {
        if (response.data.message) {
          alert(response.data.message);
        }
        if (response.data.error && response.data.error !== '0') {
          return;
        }
        if (response.data) {
          callback.call(this, response.data, callback_params);
          self.save_state();
        }
      }).catch(function (error) {
        console.log(error)
      })
    },
    save_state() {
      var datas = {
        cards: this.cards,
        author: this.author,
        theme: this.theme
      }
      localStorage.setItem('datas', JSON.stringify(datas));
    },
    load_state() {
      if (localStorage.datas) {
        var datas = JSON.parse(localStorage.getItem('datas'));
        this.cards = datas.cards;
        this.author = datas.author;
        this.theme = datas.theme;
      }
    }
  },
  mounted () {
    this.load_state();
  },
  watch: {
    theme: function () {
      this.save_state();
    }
  }
}
</script>

<style lang="scss">
html {
  width:100%;
  height:100%;
  font-size:16px;
}
body {
  width:100%;
  height:100%;
  margin:0;
}
header {
  position:relative;
  height:10%;
  display:flex;
  justify-content:flex-start;
  align-items:center;
  padding:1rem;
  box-sizing:border-box;
  text-align:right;
  img {
    width:4rem;
  }
}
p {
  margin:0;
}
label, button {
  cursor:pointer;
}
footer {
  position:absolute;
  width:100%;
  padding:1rem;
  box-sizing:border-box;
  bottom:0;
  max-width:1200px;
  right:50%;
  transform:translate(50%,0);
}
input[type="text"], textarea {
  color:inherit;
  font-size:1rem;
  padding:0.4rem;
}
input[type="text"] {
  width:14rem;
  box-sizing:border-box;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  text-align: center;
  width:100%;
  height:100%;
  .container {
    position:relative;
    width:100%;
    min-height:100%;
    padding-bottom:6rem;
    box-sizing:border-box;
    .page {
      max-width:1200px;
      margin:auto;
    }
  }
  &.dark {
    color:#fffff3;
    .container {
      background-color:#36393f;
    }
    header {
      background:#202225;
    }
    .presentation {
      background:#2f3136;
    }
    input[type="text"], textarea {
      background-color:rgba(0,0,0,0.1);
      border:0.05rem solid rgba(0,0,0,0.4);
    }
    footer {
      background:#202225;
    }
    .card {
      button {
        background:rgba(255,255,255,0.1);
        &:hover {
          background:rgba(255,255,255,0.2);
        }
        &.delete {
          background-color:rgba(255,0,0,0.2);
          &.cancel {
            background-color:rgba(255,255,255,0.2);
          }
        }
        .icon {
          &:before, &:after {
            background-color:#fffff3;
          }
        }
      }
    }
  }
  &.light {
    color: #2c3e50;
    .container {
      background-color:#cbced6;
    }
    header {
      background:#202225;
      color:#fffff3;
    }
    .presentation {
      background:#2f3136;
      color:#fffff3;
    }
    input[type="text"], textarea {
      background-color:rgba(255,255,255,0.2);
      border:0.05rem solid rgba(0,0,0,0.2);
    }
    footer {
      background:#202225;
      color:#fffff3;
    }
    .card {
      button {
        background:rgba(0,0,0,0.2);
        &:hover {
          background:rgba(0,0,0,0.4);
        }
        &.delete {
          background-color:rgba(255,0,0,0.2);
          &.cancel {
            background-color:rgba(0,0,0,0.2);
          }
        }
        .icon {
          &:before, &:after {
            background-color:#3e4348;
          }
        }
      }
    }
    .instruction input[type="radio"] {
      &:checked + .radio_label:before{
        background-color:#2c3e50;
      }
    }
  }
}
.presentation {
  padding:1.5rem 10%;
  margin-bottom:2rem;
  text-align:left;
}
.instruction {
  padding:0 1rem;
  margin:1rem 0 0.5rem;
}
.card {
  margin:auto;
  display:inline-flex;
  justify-content:center;
  align-items:flex-start;
  position:relative;
  width:14em;
  height:20em;
  border:0.1em solid rgba(0,0,0,0.35);
  border-radius:0.2rem;
  margin:0 0.1rem 0.1rem;
  text-align:left;
  textarea {
    width:92%;
    resize:none;
    height:3.3rem;
    box-sizing:border-box;
    overflow:auto;
    max-height:16.8rem;
    margin-top:0.5rem;
  }
  .card_text {
    width:92%;
    padding:0.8rem;
    overflow:auto;
    max-height:16.8rem;
    word-wrap:break-word;
  }
  .type {
    position:absolute;
    width:auto;
    padding:0 0.5rem;
    height:2rem;
    background-color:#2f3136;
    color:white;
    display:flex;
    justify-content:center;
    align-items:center;
    border-radius:0.2rem;
    bottom:.6rem;
    left:0.6rem;
    user-select: none;
    &.editable {
      cursor:pointer;
    }
  }
  button {
    position:absolute;
    border:none;
    padding:1rem 3rem;
    color:inherit;
    font-size:0;
    bottom:0.6rem;
    right:.5rem;
    border-radius:0.2rem;
    transition:background 0.5s;
    &:hover {
      background:rgba(255,255,255,0.2);
    }
    .icon {
      position:absolute;
      transform:rotate(45deg) translate(-50%,-50%);
      left:40%;
      top:50%;
      &:before, &:after {
        content: '';
        display:inline-block;
        background-color:#fffff3;
      }
    }
    &.check .icon {
      &:before{
        width:0.7rem;
        height:0.2rem;
      }
      &:after {
        width:0.2rem;
        height:1.2rem;
      }
    }
    &.delete + button.check {
      right:3rem;
    }
    &.delete {
      padding:1rem;
      .icon {
        left:50%;
        top:50%;
        &:before {
          position:absolute;
          top:50%;
          left:50%;
          transform:translate(-50%,-50%);
          width:1.4rem;
          height:0.2rem;
        }
        &:after {
          position:absolute;
          top:50%;
          left:50%;
          transform:translate(-50%,-50%);
          top:10%;
          height:1.4rem;
          width:0.2rem;
        }
      }
    }
    &.edit {
      right:3rem;
      .icon {
        top:40%;
        left:45%;
        &:before{
          position:absolute;
          width:0;
          height:0;
          border:0.19rem solid;
          left:-0.085rem;
          background:transparent!important;
          bottom:-.5rem;
          border-bottom-color:transparent;
          border-right-color:transparent;
          border-left-color:transparent;
        }
        &:after {
          width:0.3rem;
          height:1.2rem;
        }
      }
    }
  }
}
.created {
  margin-top:2rem;
}
.comment {
  line-height:1.2;
  opacity:0.7;
}
.author {
  margin-top:0.4rem;
}
.white_space {
  display:inline-block;
  width:3rem;
  border-bottom:1px solid;
}
.loader_container {
  position:absolute;
  width:100%;
  height:100%;
  background-color:rgba(0,0,0,0.2);
  top:0;
  left:0;
  z-index:10;
  .loader {
    position:absolute;
    width:6rem;
    height:6rem;
    border-radius:50%;
    border:0.05rem solid;
    border-bottom-color:transparent;
    border-right-color:transparent;
    border-left-color:transparent;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%) rotate(0);
    animation: spinning infinite linear 1s;
  }
}
.options {
  position:absolute;
  right:1rem;
}
input[type="radio"] {
  position:absolute;
  left:-99rem;
  &:checked + .radio_label:before{
    background-color:#fffff3;
  }
}
.radio_label {
  position:relative;
  &:before {
    content:'';
    display:inline-block;
    width:13px;
    height:13px;
    margin-right:0.5rem;
    border-radius:50%;
    border:0.05rem solid;
    transition:background 0.5s;
  }
}
.radio_label ~ .radio_label {
  margin-left:0.5rem;
}
@keyframes spinning {
  0% {
    transform:translate(-50%,-50%) rotate(0);
  }
  100% {
    transform:translate(-50%,-50%) rotate(360deg);
  }
}
</style>
