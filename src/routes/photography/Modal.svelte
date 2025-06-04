<script lang="ts">
  let { showModal = $bindable(), children } = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (showModal && dialog != undefined) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }
  });

  const closeModal = (e: MouseEvent) => {
    if (e.target == dialog) {
      dialog.close();
      document.body.style.overflow = "";
      showModal = false;
    }
  };
</script>

<dialog bind:this={dialog} onclick={(e) => closeModal(e)}>
  <div>
    {@render children?.()}
  </div>
</dialog>

<style>
  dialog {
    margin: auto;
    padding: 0;
    background: none;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  dialog[open] {
    animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes zoom {
    from {
      transform: scale(0.95);
    }
    to {
      transform: scale(1);
    }
  }

  dialog[open]::backdrop {
    animation: fade 0.2s ease-out;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  dialog > div {
    width: 90vw;
    height: 90vh;
  }
</style>
