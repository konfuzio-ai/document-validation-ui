<style scoped lang="scss">
.documents-list {
  background-color: $background;
  font-family: "Inter", sans-serif;
  .documents-list-top {
    display: flex;
    flex-direction: row;
    padding: 40px;

    .documents-list-top-left {
      flex: 1;

      h2 {
        font-size: 26px;
        color: $text;
        font-weight: 600;
        line-height: 33px;
        margin: 0;
      }
      p {
        font-size: 14px;
        color: $text-lighter;
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
      min-height: 80px;

      .action-box {
        align-self: center;
        width: 75%;
        height: 100%;
        background-color: $primary-low-opacity;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        position: relative;
        span {
          margin-top: 20px;
          font-weight: 600;
          font-size: 16px;
          line-height: 24px;
          color: $text;
        }
        .action-button {
          position: absolute;
          bottom: -20px;
          padding: 0 16px;
          font-weight: 500;
          font-size: 14px;
          line-height: 20px;
          cursor: pointer;
        }
      }
    }
  }
  $documents-list-height: 124px;

  .documents-list-bottom {
    display: flex;
    flex-direction: row;
    margin-top: 14px;
    border-bottom: 1px solid $detail;

    .documents-list-thumbnail {
      cursor: pointer;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: $documents-list-height;
      &.selected {
        background-color: white;
        box-sizing: border-box;
        -moz-box-sizing: border-box;
        -webkit-box-sizing: border-box;
        border-bottom: 3px solid $primary;
      }
      img {
        max-height: 60px;
        &.selected {
          outline: 1px solid $dark;
        }
      }
      .document-name {
        margin-top: 14px;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        text-align: center;
        &.selected {
          font-weight: 600;
        }
      }
    }
  }
}
</style>
<template>
  <div class="documents-list" v-if="selectedCategory">
    <div class="documents-list-top">
      <div class="documents-list-top-left">
        <h2>{{ selectedCategory.name }}</h2>
        <p>
          {{ selectedCategory.description }}
        </p>
      </div>
      <div class="documents-list-top-right">
        <div class="action-box">
          <span>{{ $t("upload_documents") }}</span>
          <b-button class="action-button" type="is-primary">{{
            $t("request_trial")
          }}</b-button>
        </div>
      </div>
    </div>
    <div class="documents-list-bottom" v-if="documents">
      <b-carousel-list :data="documents" :items-to-show="4" :icon-pack="fas">
        <template #item="document">
          <div
            :class="[
              'documents-list-thumbnail',
              documentId == document.id && 'selected'
            ]"
            v-on:click="changeDocument(document.id)"
          >
            <img
              :class="[
                'img-thumbnail',
                documentId == document.id && 'selected'
              ]"
              src="https://testing.konfuzio.com/page/show-thumbnail/107/"
              alt
            />
            <div
              :class="[
                'document-name',
                documentId == document.id && 'selected'
              ]"
            >
              {{ document.data_file_name }}
            </div>
          </div>
        </template>
      </b-carousel-list>
      <!-- <div
        :class="[
          'documents-list-thumbnail',
          documentId == document.id && 'selected'
        ]"
        v-for="document in documents"
        v-bind:key="document.id"
        v-on:click="changeDocument(document.id)"
      >
        <img
          :class="['img-thumbnail', documentId == document.id && 'selected']"
          :src="document.thumbnail_url"
          alt
        />
        <div
          :class="['document-name', documentId == document.id && 'selected']"
        >
          {{ document.data_file_name }}
        </div>
      </div> -->
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
    ...mapState("document", ["documentId"]),
    ...mapState("category", ["documents", "selectedCategory"])
  },
  methods: {
    changeDocument(documentId) {
      this.$store.dispatch("document/setDocId", documentId);
    }
  }
};
</script>
