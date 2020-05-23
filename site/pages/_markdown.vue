<template>
    <div v-html="html"></div>
</template>

<script>
export default {
    async asyncData({params}) {
        console.log(`${params.markdown}`)
        return await import(`@/markdown/${params.markdown}.md`)
    }
}
</script>
