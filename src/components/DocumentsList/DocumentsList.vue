<style scoped lang="scss">
.documents-list {
  background-color: var(--bgColor);
  font-family: "Inter", sans-serif;
  .documents-list-top {
    display: flex;
    flex-direction: row;
    padding: 40px;

    .documents-list-top-left {
      flex: 1;

      h2 {
        font-size: 26px;
        color: var(--textColor);
        font-weight: 600;
        line-height: 33px;
        margin: 0;
      }
      p {
        font-size: 14px;
        color: var(--secondaryTextColor);
        font-weight: 400;
        line-height: 20px;
        margin: 0;
      }
    }
    .documents-list-top-right {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;

      .action-box {
        align-self: center;
        width: 75%;
        height: 100%;
        background-color: var(--lowOpacityPrimaryColor);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        position: relative;
        span {
          margin-top: 20px;
          font-weight: 600;
          font-size: 16px;
          line-height: 24px;
          color: var(--textColor);
        }
        button {
          position: absolute;
          bottom: -20px;
          height: 40px;
          background-color: var(--primaryColor);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0 16px;
          font-weight: 500;
          font-size: 14px;
          line-height: 20px;
          cursor: pointer;
          &:hover {
            background-color: var(--hoverPrimaryColor);
          }
        }
      }
    }
  }
  .documents-list-bottom {
    display: flex;
    flex-direction: row;
    margin-top: 14px;
    min-height: 124px;
    cursor: pointer;
    .documents-list-thumbnail {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      &.selected {
        background-color: white;
        border-bottom: 3px solid var(--primaryColor);
      }
      img {
        max-height: 60px;
        &.selected {
          outline: 1px solid var(--thumbnailSelectedColor);
        }
      }
      .document-name {
        margin-top: 14px;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        &.selected {
          font-weight: 600;
        }
      }
    }
  }
}
</style>
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
