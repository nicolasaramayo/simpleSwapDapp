# 🚀 Despliegue en Vercel - SimpleSwap DEX

## 📋 Requisitos previos

1. **Cuenta en Vercel**: https://vercel.com
2. **Cuenta en GitHub**: Para conectar el repositorio
3. **Contratos desplegados**: Ya completado en Sepolia

## 🔧 Configuración del proyecto

### Contratos desplegados en Sepolia:
- **SimpleSwap**: `0x2843159d568Fa5e059Efd49f22e5A26542bfE392`
- **TokenA (TTA)**: `0x2dD35434773eB36883408EdDEfe1e5D8B3DC54FF`
- **TokenB (TTB)**: `0x22A0aC9E38ce8843961A849C473279EC3c4AA332`

### Configuración de red Sepolia:
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/
- **Explorer**: https://sepolia.etherscan.io

## 📦 Pasos para desplegar en Vercel

### 1. Preparar el repositorio
```bash
# Asegúrate de que todos los cambios estén commitados
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Conectar con Vercel
1. Ve a [Vercel](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Haz clic en "New Project"
4. Importa tu repositorio de GitHub

### 3. Configurar el proyecto
- **Framework Preset**: Create React App
- **Root Directory**: `./` (raíz del proyecto)
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: `cd frontend && npm install`

### 4. Variables de entorno (opcional)
Si necesitas configurar variables de entorno:
- `REACT_APP_NETWORK`: sepolia
- `REACT_APP_CHAIN_ID`: 11155111

### 5. Desplegar
- Haz clic en "Deploy"
- Vercel construirá y desplegará automáticamente

## 🌐 URLs del proyecto

### Contratos en Etherscan:
- [SimpleSwap](https://sepolia.etherscan.io/address/0x2843159d568Fa5e059Efd49f22e5A26542bfE392)
- [TokenA](https://sepolia.etherscan.io/address/0x2dD35434773eB36883408EdDEfe1e5D8B3DC54FF)
- [TokenB](https://sepolia.etherscan.io/address/0x22A0aC9E38ce8843961A849C473279EC3c4AA332)

### Faucets para ETH de Sepolia:
- [Alchemy Faucet](https://sepoliafaucet.com/)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

## 🔄 Actualizaciones automáticas

Una vez configurado, cada push a la rama `main` desplegará automáticamente en Vercel.

## 🐛 Solución de problemas

### Error de build:
- Verifica que `react-scripts` esté instalado en `frontend/package.json`
- Asegúrate de que todas las dependencias estén en `dependencies`, no en `devDependencies`

### Error de red:
- Verifica que MetaMask esté configurado para Sepolia
- Asegúrate de tener ETH de Sepolia para las transacciones

## 📱 Uso del DEX

1. Conecta tu wallet MetaMask
2. Cambia a la red Sepolia
3. Obtén ETH de un faucet
4. ¡Comienza a hacer swaps! 