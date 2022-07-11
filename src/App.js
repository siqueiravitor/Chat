import React, { useEffect, useState } from 'react';
import socketIOClient from 'socket.io-client';
import ScrollToBottom from 'react-scroll-to-bottom';

import {
  Container, Conteudo, Header, Form, Campo, Label, Input, Select,
  BtnAcessar, HeaderChat, ImgUsuario, NomeUsuario, ChatBox, ConteudoChat,
  MsgEnviada, DetMsgEnviada, TextMsgEnviada, MsgRecebida, DetMsgRecebida,
  TextMsgRecebida, EnviarMsg, CampoMsg, BtnEnviarMsg, AlertaErro
} from './styles/styles';

import api from './config/api';

let socket;

function App() {

  const ENDPOINT = "http://localhost:8080/";

  const [logado, setLogado] = useState(false);
  const [usuarioId, setUsuarioId] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [sala, setSala] = useState('');
  const [salas, setSalas] = useState([]);

  // const [logado, setLogado] = useState(true);
  // const [nome, setNome] = useState("Vitor Siqueira");
  // const [sala, setSala] = useState(1);

  const [mensagem, setMensagem] = useState('');
  const [listaMensagem, setListaMensagem] = useState([]);

  const [status, setStatus] = useState({
    type: '',
    mensagem: ''
  });

  useEffect(() => {
    socket = socketIOClient(ENDPOINT);
    listarSalas();
  }, [])

  useEffect(() => {
    socket.on("receber_mensagem", (dados) => {
      setListaMensagem([...listaMensagem, dados])
    })
  })

  const listarSalas = async () => {
    await api.get('/listar-sala')
      .then((response) => {
        setSalas(response.data.salas)
      })
      .catch((err) => {
        if (err.response) {
          setStatus({
            type: 'erro',
            mensagem: err.response.data.mensagem
          })
        } else {
          setStatus({
            type: 'erro',
            mensagem: "Erro no servidor!"
          })
        }
      })
  }

  const conectarSala = async e => {
    e.preventDefault();
    console.log('Acessou a sala ' + sala + " com o email " + email)

    const headers = {
      'Content-Type': 'application/json'
    }

    await api.post('/validar-acesso', { email }, { headers })
      .then((response) => {
        console.log(response.data.mensagem);
        console.log(response.data.usuario.id);
        console.log(response.data.usuario.nome);

        setNome(response.data.usuario.nome)
        setUsuarioId(response.data.usuario.id)
        setLogado(true);
        socket.emit("sala_conectar", sala);
        listarMensagens()
      })
      .catch((err) => {
        if (err.response) {
          setStatus({
            type: 'erro',
            mensagem: err.response.data.mensagem
          })
        } else {
          setStatus({
            type: 'erro',
            mensagem: 'Erro no servidor'
          })

        }
      })
  }

  const listarMensagens = async () => {
    await api.get('/listar-mensagens/' + sala)
      .then((response) => {
        console.log(response)
        console.log(response.data.mensagens)
        // setListaMensagem([...listaMensagem, response.mensagens])
        setListaMensagem(response.data.mensagens)
      })
      .catch((err) => {
        if (err.response) {
          console.log(err.response.data.mensagem)
        } else {
          console.log("Erro de conexão!")
        }
      })
  }

  const enviarMensagem = async e => {
    e.preventDefault();

    console.log("Mensagem: " + mensagem)
    const conteudoMensagem = {
      sala,
      conteudo: {
        mensagem,
        usuario: {
          id: usuarioId,
          nome
        }
      },
    }
    console.log(conteudoMensagem)

    await socket.emit("enviar_mensagem", conteudoMensagem);
    setListaMensagem([...listaMensagem, conteudoMensagem.conteudo]);
    setMensagem("");

  }

  return (
    <Container>
      {!logado ?
        <Conteudo>
          <Header>Meu Chat</Header>
          <Form onSubmit={conectarSala}>
            {status.type === 'erro' ?
              <AlertaErro>
                {status.mensagem}
              </AlertaErro>
              :
              ""
            }
            <Campo>
              <Label>Email:</Label>
              <Input type="text"
                placeholder='Email'
                name="email"
                value={email}
                autoComplete={'off'}
                onChange={(text) => { setEmail(text.target.value) }}
              />
            </Campo>

            <Campo>
              <Label>Sala:</Label>
              {/* <input type="text"
              placeholder='Sala'
              name="sala"
              value={sala}
              onChange={(text) => { setSala(text.target.value) }}
                /> */}
              <Select name="sala" value={sala} onChange={(text) => setSala(text.target.value)}>
                <option value="">Selecione</option>
                {
                  salas.map((sala) => {
                    return (
                      <option value={sala.id} key={sala.id}>{sala.nome}</option>
                    )
                  })
                }
              </Select>
            </Campo>


            <BtnAcessar>Acessar</BtnAcessar>
          </Form>
        </Conteudo>

        :

        <ConteudoChat>
          <HeaderChat>
            {/* Sala {sala} - {nome} */}
            <ImgUsuario src='foto.jpg' alt='foto' />
            <NomeUsuario>{nome}</NomeUsuario>
          </HeaderChat>
          <ChatBox>
            <ScrollToBottom className='scrollMsg'>
              {
                listaMensagem.map((msg, key) => {
                  return (
                    <div key={key}>
                      {usuarioId === msg.usuario.id ?
                        <MsgEnviada>
                          <DetMsgEnviada>
                            <TextMsgEnviada>
                              {msg.mensagem}
                            </TextMsgEnviada>
                          </DetMsgEnviada>
                        </MsgEnviada>
                        :
                        <MsgRecebida>
                          <DetMsgRecebida>
                            <TextMsgRecebida>
                              {msg.usuario.nome + ": " + msg.mensagem}
                            </TextMsgRecebida>
                          </DetMsgRecebida>
                        </MsgRecebida>
                      }
                    </div>
                  )
                })
              }
            </ScrollToBottom>
          </ChatBox>
          <EnviarMsg onSubmit={enviarMensagem}>
            <CampoMsg type="text" name='mensagem' placeholder='Mensagem...' value={mensagem} onChange={(text) => setMensagem(text.target.value)} />

            <BtnEnviarMsg>Enviar</BtnEnviarMsg>
          </EnviarMsg>
        </ConteudoChat>
      }
    </Container>
  );
}

export default App;
