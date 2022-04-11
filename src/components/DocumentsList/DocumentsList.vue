<template>
  <div class="documents-list">
    <div class="documents-list-top">
      <div class="documents-list-top-left">
        <h2>Title</h2>
        <p>
          Unter Rechnung wird jedes Dokument verstanden, das die Abrechnung über
          eine Lieferung oder sonstige Leistung zum Inhalt hat, gleichgültig,
          wie dieses Dokument im Geschäftsverkehr bezeichnet wird.
        </p>
      </div>
      <div class="documents-list-top-right">
        <div class="action-box">
          <span>Demozugang kostenfrei anfragen</span>
          <button type="button">Testzugang erhalten</button>
        </div>
      </div>
    </div>
    <div class="documents-list-bottom">
      <div
        :class="[
          'documents-list-thumbnail',
          currentPage == page.pageNumber && 'selected'
        ]"
        v-for="page in pages"
        v-bind:key="page.id"
        v-on:click="changePage(page.pageNumber)"
      >
        <img
          :class="[
            'img-thumbnail',
            currentPage == page.pageNumber && 'selected'
          ]"
          :src="page.image"
          alt
        />
        <div
          :class="[
            'document-name',
            currentPage == page.pageNumber && 'selected'
          ]"
        >
          {{ page.pageNumber }}.pdf
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

/**
 * This component creates a horizontal list of documents
 * with thumbnail pictures which are clickable.
 */

export default {
  name: "DocumentsList",
  props: {},
  computed: {
    ...mapState("document", ["pages"]),
    ...mapState("display", ["currentPage"])
  },
  methods: {}
};
</script>
