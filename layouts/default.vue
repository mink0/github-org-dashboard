<template>
  <div class="d-flex flex-column h-100">
    <div id="app" class="flex-shrink-0">
      <b-navbar toggleable="lg" type="dark" variant="primary" class="mb-5">
        <b-navbar-brand href="#">Org</b-navbar-brand>

        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

        <b-collapse id="nav-collapse" is-nav>
          <!-- Left aligned nav items -->
          <b-navbar-nav> </b-navbar-nav>

          <!-- Right aligned nav items -->
          <b-navbar-nav class="ml-auto">
            <b-nav-item to="/users">Users</b-nav-item>
            <b-nav-item to="/repos">Repositories</b-nav-item>
            <b-nav-item to="/about">About</b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>

      <div class="container">
        <nuxt />
      </div>
    </div>

    <footer class="footer mt-auto py-3">
      <div class="container">
        <div class="row">
          <div class="col"><a href="#">Github Dashboard</a><span class="ml-1">Copyright(©) v.2020</span></div>
          <div class="col text-right">
            <span class="mr-1 small">Powered by</span><a href="https://vuejs.org" class="small">VueJS</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import sseStream from '~/services/sse'

export default {
  beforeMount() {
    sseStream(this.$store)
  }
}
</script>

<style>
@import 'bootswatch/dist/lumen/bootstrap.min.css';

body {
  background-color: #f2f2f2;
  color: #23282c;
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.1s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to /* .fade-leave-active до версии 2.1.8 */ {
  opacity: 0;
}
</style>
