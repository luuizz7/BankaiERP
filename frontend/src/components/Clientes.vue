<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const clientes = ref([])

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:5000/clientes')
    clientes.value = response.data
  } catch (err) {
    console.error('Erro ao buscar clientes:', err)
  }
})
</script>

<template>
  <div class="clientes">
    <h1>Lista de Clientes</h1>
    <ul>
      <li v-for="cliente in clientes" :key="cliente.id">
        {{ cliente.nome }} - {{ cliente.email }} - {{ cliente.telefone }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.clientes {
  padding: 20px;
  font-family: Arial, sans-serif;
}
</style>
