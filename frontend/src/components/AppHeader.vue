<script setup>
import logo from '../assets/logo.svg';
</script>

<template>
  <header class="hidden md:flex items-center px-6 py-4 bg-secondary text-primary">
    <router-link
      to="/"
      class="flex items-center gap-3"
    >
      <img
        :src="logo"
        alt="Band-Logo"
        class="h-10 w-10"
      >
      <span class="text-lg font-semibold">Booking</span>
    </router-link>
  </header>
</template>
