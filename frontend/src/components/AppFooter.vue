<script setup>
import logo from '../assets/logo.svg';
</script>

<template>
  <footer class="md:hidden flex flex-col items-center gap-2 px-6 py-4 bg-secondary text-primary">
    <img
      :src="logo"
      alt="Band-Logo"
      class="h-10 w-10"
    >
    <span class="text-sm">Booking</span>
  </footer>
</template>
