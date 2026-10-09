export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    const relativo = /^\.{1,2}\//.test(especificador);
    if (error?.code === "ERR_MODULE_NOT_FOUND" && relativo && !/\.[cm]?jsx?$/.test(especificador)) {
      return siguiente(`${especificador}.js`, contexto);
    }
    throw error;
  }
}
